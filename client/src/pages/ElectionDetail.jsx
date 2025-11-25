import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function ElectionDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [voting, setVoting] = useState(false);
  const [participating, setParticipating] = useState(false);
  const [partErr, setPartErr] = useState('');
  const timerRef = useRef(null);

  useEffect(()=>{ load(); return ()=>{ if(timerRef.current) clearTimeout(timerRef.current); }; }, [id]);

  async function load(){
    setLoading(true);
    try {
      const res = await api.get(`/elections/${id}`);
      setData(res.data);
      // if user already voted, preselect votedFor
      if (res.data?.votedFor) setSelected(res.data.votedFor);
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not load');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(e){
    e.preventDefault();
    if (!user) { nav('/login'); return; }
    if (!(user.role === 'voter' || user.role === 'candidate')) {
      alert('Only voters and candidates may cast votes.');
      return;
    }
    if (!selected) { alert('Select a candidate'); return; }
    setVoting(true);
    try {
      await api.post(`/elections/${id}/vote`, { candidateId: selected });
      // show toast and navigate back after short delay
      alert('Vote cast successfully');
      timerRef.current = setTimeout(()=>nav('/elections'), 1200);
    } catch (err) {
      alert(err?.response?.data?.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  }

  // Candidate participation: register the logged in user as a candidate
  async function handleParticipate(e){
    e.preventDefault();
    setPartErr('');
    if (!user) { nav('/login'); return; }
    if (user.role !== 'candidate') { setPartErr('Only users with candidate role can participate'); return; }
    setParticipating(true);
    try {
      // send basic info - backend will set createdBy to req.user
      const name = user.name || user.email || 'Candidate';
      await api.post(`/elections/${id}/candidates`, { name, description: `${name}'s manifesto` });
      await load(); // refresh candidates
      alert('Registered as candidate');
    } catch (err) {
      setPartErr(err?.response?.data?.message || 'Failed to register as candidate');
    } finally {
      setParticipating(false);
    }
  }

  if (loading) return <div style={{ padding:20 }}>Loading...</div>;
  if (!data) return null;

  const { election, candidates = [], canVote, hasVoted, votedFor, isCandidate } = data;

  return (
    <div style={{ padding: 20, maxWidth: 920, margin: '0 auto' }}>
      <div className="card">
        <h2 className="h1">{election.title}</h2>
        <div className="note" style={{ marginTop: 6 }}>{election.description}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, marginTop:12 }}>
        <div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><div className="h2">Candidates</div><div className="note">Select to view schemes and cast vote.</div></div>
              <div>
                {isCandidate && <div className="note" style={{ fontWeight:700 }}>You are a candidate</div>}
                {!isCandidate && user?.role === 'candidate' && (
                  <button className="btn" onClick={handleParticipate} disabled={participating}>
                    {participating ? 'Registering…' : 'Participate'}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleVote} style={{ marginTop: 12 }}>
              {candidates.map(c => (
                <div key={c._id} className="vote-card" style={{ marginTop: 8 }}>
                  <div style={{ display:'flex', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div style={{ fontWeight:700 }}>{c.name}</div>
                        <div className="note">{c.party || ''}</div>
                      </div>
                      <div className="note" style={{ marginTop:6 }}>{c.description}</div>
                      <div style={{ marginTop:8 }}>
                        <div style={{ fontWeight:700 }}>Schemes</div>
                        <ul>
                          {Array.isArray(c.schemes) && c.schemes.length ? c.schemes.map((s,i)=> <li key={i} className="note">• {s}</li>) : <li className="note">No schemes listed</li>}
                        </ul>
                      </div>

                      <div style={{ marginTop:8 }}>
                        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <input type="radio" name="candidate" value={c._id} checked={String(selected) === String(c._id) || String(votedFor) === String(c._id)} onChange={()=>setSelected(c._id)} disabled={!canVote || hasVoted} />
                          <span className="note">Vote for {c.name}</span>
                        </label>
                        {hasVoted && String(votedFor) === String(c._id) && (<span className="note" style={{ fontWeight:700, marginLeft:10 }}>Your choice</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop:12 }}>
                <button className="btn" type="submit" disabled={!canVote || hasVoted || voting}>
                  {voting ? 'Casting…' : (hasVoted ? 'Already voted' : 'Cast Vote')}
                </button>
              </div>
            </form>

            {partErr && <div className="message" style={{ marginTop: 10 }}>{partErr}</div>}
          </div>
        </div>

        <aside>
          <div className="card">
            <div className="h2">Election details</div>
            <div className="note" style={{ marginTop:8 }}>
              <strong>Start:</strong> {election.startAt || 'N/A'} <br/>
              <strong>End:</strong> {election.endAt || 'N/A'} <br/>
              <strong>Status:</strong> {new Date() < new Date(election.startAt || 0) ? 'Upcoming' : (new Date() > new Date(election.endAt || Infinity) ? 'Closed' : 'Open')}
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="card" style={{ marginTop:12 }}>
              <div className="h2">Admin</div>
              <div className="note">As admin you can view results and announce winners.</div>
              <button className="btn" onClick={() => nav(`/elections/${id}/results`)}>View results</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
