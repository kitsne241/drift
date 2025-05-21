export const sampleScope: Scope = {
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
                  character: '2',
                  children: [],
                },
                {
                  character: 'a',
                  children: [],
                },
              ],
            },
            {
              character: '+',
              children: [],
            },
            {
              character: '3',
              children: [],
            },
          ],
        },
        {
          character: '5',
          children: [],
        },
      ],
    },
    {
      character: '=',
      children: [],
    },
    {
      character: '1',
      children: [],
    },
  ],
}
