import React from 'react';
import ReviewPage from '../pages/prevent/ReviewPage.jsx';
import CoSignPage from '../pages/prevent/CoSign.jsx';
export default [
  {path:'/review',element:<ReviewPage/>,roles:['supervisor','competent_authority','regional_officer','bureau_officer'],public:false},
  {path:'/prevent/back',element:<CoSignPage/>,roles:['student'],public:false},
];
