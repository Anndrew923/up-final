/** Merge conditional Tailwind class strings (WHY): Grid span and card shells compose without template clutter. */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
