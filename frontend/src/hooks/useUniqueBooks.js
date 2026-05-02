import { useMemo } from "react";

export default function useUniqueBooks(...lists) {
  return useMemo(() => {
    const unique = new Map();
    lists.flat().forEach((book) => {
      if (book && book.id) unique.set(book.id, book);
    });
    return Array.from(unique.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, lists);
}

