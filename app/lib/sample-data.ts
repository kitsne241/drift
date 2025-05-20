export const sampleScope: Scope = {
  Type: 'Sum',
  Children: [
    {
      Type: 'Frac',
      Children: [
        {
          Type: 'Sum',
          Children: [
            {
              Type: 'Product',
              Children: [
                {
                  Character: '2',
                  Children: [],
                },
                {
                  Character: 'a',
                  Children: [],
                },
              ],
            },
            {
              Character: '+',
              Children: [],
            },
            {
              Character: '3',
              Children: [],
            },
          ],
        },
        {
          Character: '5',
          Children: [],
        },
      ],
    },
    {
      Character: '=',
      Children: [],
    },
    {
      Character: '1',
      Children: [],
    },
  ],
}
