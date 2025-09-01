export function validateSlots(slots) {
  function timeToMinutes(str) {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  }

  const sorted = slots
    .map(s => ({ start: timeToMinutes(s.start), end: timeToMinutes(s.end) }))
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].end <= sorted[i].start) {
      throw new Error(`Slot ${i + 1}: end <= start`);
    }
    if (i > 0 && sorted[i].start < sorted[i - 1].end) {
      throw new Error(`Slot ${i + 1} overlaps with previous`);
    }
  }
}
