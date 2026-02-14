
export function isClass(value: any): boolean {
  return typeof value === 'function' && 
         value.prototype !== undefined && 
         value.prototype.constructor === value;
}
