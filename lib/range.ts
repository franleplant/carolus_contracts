export default function range(exclusiveUpperBound: number): Array<number> {
  const rangeList = [];
  for (let i = 0; i < exclusiveUpperBound; i++) {
    rangeList.push(i);
  }

  return rangeList;
}
