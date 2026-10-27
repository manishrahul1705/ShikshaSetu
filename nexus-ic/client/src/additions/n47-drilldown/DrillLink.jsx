import React from 'react';
import { Link } from 'react-router-dom';

/** N47: wraps a dashboard number so it opens the exact cases behind it. */
export default function DrillLink({ row, children }) {
  return (
    <Link className="underline decoration-dotted" to={`/impact/cases?row=${encodeURIComponent(row)}`} title="Show the cases behind this number">
      {children}
    </Link>
  );
}
