import React, {useState} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {s5Request} from '../../pages/closure/api.jsx';
import InlinePreflight from './InlinePreflight.jsx';
export default function OfficerAction({caseId}) {
  const queryClient = useQueryClient();
  const [type,setType]=useState('NOTICE'),[subject,setSubject]=useState(''),[direction,setDirection]=useState('ALLOW'),[reason,setReason]=useState(''),[check,setCheck]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{
    if(!check){setCheck(await s5Request('/prevent/check-action',{method:'POST',body:{caseId,actionType:type,details:{subject,direction}}}));return;}
    await s5Request('/actions/record',{method:'POST',body:{caseId,actionType:type,subject,direction,proceedReason:reason}});
    queryClient.invalidateQueries({ queryKey: ['s5'] });
    setCheck(null);setSubject('');setReason('');setMessage('Action recorded in the case history.');
  }catch(e){setMessage(e.message.replaceAll('_',' ').toLowerCase());}finally{setBusy(false);}}
  function reset(){setCheck(null);setReason('');setMessage('');}
  return <form className="card card-pad space-y-4" onSubmit={submit}><h2 className="card-title">Record an institution action</h2><label className="block">Action type<select className="ml-3" value={type} onChange={e=>{setType(e.target.value);reset();}}>{[['NOTICE','Notice'],['INSTRUCTION','Instruction'],['DOCUMENT_REQUEST','Document request'],['INSPECTION','Inspection'],['OTHER','Other action']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="block">Action subject<input required className="block w-full mt-1" value={subject} onChange={e=>{setSubject(e.target.value);reset();}} /></label>{type==='INSTRUCTION' && <label className="block">Direction<select className="ml-3" value={direction} onChange={e=>{setDirection(e.target.value);reset();}}><option value="ALLOW">Allow</option><option value="DENY">Deny</option></select></label>}<InlinePreflight result={check} caseId={caseId} reason={reason} onReason={setReason}/><button className="btn-primary" disabled={busy || (check?.result==='REVIEW' && !reason.trim())}>{busy?'Checking…':check?'Record action':'Check before recording'}</button>{message && <p role="status">{message}</p>}</form>;
}
