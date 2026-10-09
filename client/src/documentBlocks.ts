export function documentBlocks(
  text: string,
): { heading: boolean; text: string }[] {
  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      heading:
        /^#{1,3}\s/.test(line) ||
        (line.length < 85 &&
          /^[A-Z]/.test(line) &&
          !/[.!?;]$/.test(line) &&
          !/^[-*•\d]/.test(line)),
      text: line.replace(/^#{1,3}\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1"),
    }));
}
