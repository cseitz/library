import { Effect, Layer, Logger, LogLevel, Option } from 'effect';
import { Tag } from '@library/effect-tag';
import { toLower } from 'lodash-es';

interface MinimumLogLevelPattern {
  tagPattern: string;
  level: LogLevel.LogLevel;
  priority?: number;
}

export class MinimumLogLevels extends Tag<MinimumLogLevels, {
  levels?: MinimumLogLevelPattern[];
  defaultLevel?: LogLevel.LogLevel;
}>()('MinimumLogLevels', {

}) {
  static DefaultLevel = LogLevel.Info;

  static getMatchingLevelForTagAndLevels(tag: string, levels: MinimumLogLevelPattern[], ctx?: { defaultLevel?: LogLevel.LogLevel }) {
    const matchingLevels = levels.filter(level => {
      return toLower(tag).startsWith(toLower(level.tagPattern));
    }).sort((a, b) => {
      const aPriority = Math.pow(10, a.priority ?? 0);
      const bPriority = Math.pow(10, b.priority ?? 0);
      const aLevelPriority = a.level.ordinal;
      const bLevelPriority = b.level.ordinal;
      const aTotalPriority = aPriority * aLevelPriority;
      const bTotalPriority = bPriority * bLevelPriority;
      return bTotalPriority - aTotalPriority;
    });
    const highestPriorityLevel = matchingLevels[0];
    if (!highestPriorityLevel) {
      return ctx?.defaultLevel ?? MinimumLogLevels.DefaultLevel;
    }
    return highestPriorityLevel.level;
  }

  static getLogLevelForTag(tag: string) {
    return Effect.gen(MinimumLogLevels, function* () {
      const maybeMinimumLogLevels = yield* Effect.serviceOption(MinimumLogLevels);
      if (Option.isNone(maybeMinimumLogLevels)) {
        return MinimumLogLevels.DefaultLevel;
      }
      return this.getMatchingLevelForTagAndLevels(tag, maybeMinimumLogLevels.value.levels ?? [], maybeMinimumLogLevels.value);
    });
  }

  static for<TTag extends { _tag: string }>(tag: TTag, opts: { level: LogLevel.LogLevel, priority?: number }) {
    return MinimumLogLevels.appendLevels({
      tagPattern: tag._tag,
      level: opts.level,
      priority: opts.priority,
    });
  }

  static appendLevels(...levels: MinimumLogLevelPattern[]) {
    return Effect.gen(function* () {
      const maybeMinimumLogLevels = yield* Effect.serviceOption(MinimumLogLevels);
      if (Option.isSome(maybeMinimumLogLevels)) {
        return MinimumLogLevels.of({
          ...maybeMinimumLogLevels.value,
          levels: [...(maybeMinimumLogLevels.value.levels ?? []), ...levels],
        });
      }
      return MinimumLogLevels.of({ levels });
    });
  }

  static setLogLevelForTag(tagPrefix: string, opts: { level: LogLevel.LogLevel, priority?: number }) {
    return Effect.provideServiceEffect(
      MinimumLogLevels,
      MinimumLogLevels.appendLevels({
        tagPattern: tagPrefix,
        level: opts.level,
        priority: opts.priority,
      })
    )
  }

  static withMinimumLogLevel(tag: string, level?: LogLevel.LogLevel) {
    return Effect.andThen(
      MinimumLogLevels.getLogLevelForTag(tag),
      (incomingLevel) => Logger.withMinimumLogLevel(incomingLevel || level)
    );
  }

  static makeLayer(config: {
    levels?: MinimumLogLevelPattern[],
    defaultLevel?: LogLevel.LogLevel
  }) {
    return Layer.succeed(MinimumLogLevels, MinimumLogLevels.of({
      levels: config.levels ?? [],
      defaultLevel: config.defaultLevel ?? MinimumLogLevels.DefaultLevel,
    }));
  }
}

export const Log = Object.assign(Effect.log, {
  debug: Effect.logDebug,
  error: Effect.logError,
  info: Effect.logInfo,
  trace: Effect.logTrace,
  warn: Effect.logWarning,
  fatal: Effect.logFatal,

  // getAnnotations: Effect.logAnnotations,

  MinimumLogLevels: MinimumLogLevels,
  getLogLevelForTag: MinimumLogLevels.getLogLevelForTag,
  withMinimumLogLevel: MinimumLogLevels.withMinimumLogLevel,
  setLogLevelForTag: MinimumLogLevels.setLogLevelForTag,

  Level: LogLevel,
});
