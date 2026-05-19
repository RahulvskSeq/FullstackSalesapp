// import React from 'react';
// import { CURRENT_MONTH_IDX, MO } from './constants';
// export const MonthContext = React.createContext({
//   selectedMonthIdx: CURRENT_MONTH_IDX,
//   setSelectedMonthIdx: ()=>{},
//   MO: MO,
//   currentMonthIdx: CURRENT_MONTH_IDX,
//   currentMonthLabel: 'May 2026',
// });
// export const useMonth = () => React.useContext(MonthContext);
import React from 'react';
import { MO as MO_DEFAULT, CURRENT_MONTH_IDX } from './constants';

export const MonthContext = React.createContext({
  selectedMonthIdx:    CURRENT_MONTH_IDX,
  setSelectedMonthIdx: ()=>{},
  MO:                  MO_DEFAULT,
  currentMonthIdx:     CURRENT_MONTH_IDX,
  currentMonthLabel:   'May 2026',
});

export const useMonth = () => React.useContext(MonthContext);