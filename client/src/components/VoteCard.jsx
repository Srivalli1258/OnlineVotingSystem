 import React, { useState } from 'react';
 import api from '../api/axios';
 export default function VoteCard({ electionId, candidates }){
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  async function handleVote(){
    if (!selected) return setMessage('Select a candidate');
    try{
      await api.post(`/elections/${electionId}/vote`, { candidateId: selected });
      setMessage('Vote submitted. Thank you!');
    }catch(err){
      setMessage(err.response?.data?.message || 'Voting failed');
    }
  }
  return (
    <div>
      <h4>Cast your vote</h4>
      <ul>
        {candidates.map(c => (
          <li key={c._id}>
            <label>
              <input type="radio" name="cand" value={c._id} onChange={()=>setSelected(c._id)}
 /> {c.name}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={handleVote}>Vote</button>
      {message && <p>{message}</p>}
    </div>
  );
 }