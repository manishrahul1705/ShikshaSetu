import React from 'react';
import {Link} from 'react-router-dom';
import {useS5} from '../../pages/closure/api.jsx';
export default function CombinedCounter(){
  const q=useS5('/combined-requests/counts');
  return <section className="card card-pad"><h2 className="card-title">Requests combined</h2>{Number.isFinite(q.data?.denominator)?<><p className="text-2xl font-bold">{q.data.numerator} of {q.data.denominator} query items</p><p className="text-xs text-slate-500">{q.data.scope}</p></>:<p>{q.isLoading?'Loading request counts…':'Request counts are not available.'}</p>}<Link className="mt-2 inline-block underline" to="/requests/combined">Open combined requests</Link></section>;
}
