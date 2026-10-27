import { describe, expect, it } from 'vitest';
import { comparisonScenarios } from '../src/modules/additions/n84-compare/service.js';

describe('[A-N84] Today vs with AWAAZ DASTAK comparison', () => {
  it('[A-N84] labels scripted values separately from values derived from recorded actions', () => {
    const model = comparisonScenarios({ lettersToCollege: 4, acknowledgedTransfers: 2, repeatedDocumentRequestsFlagged: 1 });
    expect(model.illustrative).toEqual({ lettersToCollege: 3, acknowledgedTransfers: 0, repeatedDocumentRequestsFlagged: 0 });
    expect(model.recorded).toEqual({ lettersToCollege: 4, acknowledgedTransfers: 2, repeatedDocumentRequestsFlagged: 1 });
  });
});
