import { useEffect, useState } from 'react';

export default function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(import.meta.env.VITE_GATEWAY_URL + "/health")
      .then(r => r.json()).then(setData)
      .catch(() => setData([{name:"gateway",status:"offline"}]))
  }, []);

  return (
    <div style={{fontFamily:"sans-serif",padding:"2rem"}}>
      <h1>System health</h1>
      <ul>
        {data.map(({name,status}) =>
          <li key={name}>{name} : {status}</li>)}
      </ul>
    </div>
  );
}
