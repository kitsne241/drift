import type { ScopeData } from './scope'

export const sampleScopeData: ScopeData = {
  type: 'Sum',
  children: [
    {
      type: 'Frac',
      children: [
        {
          type: 'Sum',
          children: [
            {
              type: 'Product',
              children: [
                {
                  type: 'Single',
                  character: '2',
                  children: [],
                },
                {
                  type: 'Single',
                  character: 'a',
                  children: [],
                },
              ],
            },
            {
              type: 'Single',
              character: '+',
              children: [],
            },
            {
              type: 'Single',
              character: '3',
              children: [],
            },
          ],
        },
        {
          type: 'Single',
          character: '5',
          children: [],
        },
      ],
    },
    {
      type: 'Single',
      character: '=',
      children: [],
    },
    {
      type: 'Single',
      character: '1',
      children: [],
    },
  ],
}
