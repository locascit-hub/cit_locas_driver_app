

function getEndpoint(type) {
  if(type === 'helper') {
    return `${process.env.REACT_APP_HELPER_BACKEND}`;
  }
  const qid=parseInt(localStorage.getItem('sno'));
  const token= localStorage.getItem('test');
  if(qid<= 1500) {
    return `${process.env.REACT_APP_BACKEND_ENDPOINT1}`; //expected req 90k
  } else if(1500< qid <= 3100) {
       return `${process.env.REACT_APP_BACKEND_ENDPOINT2}`;                         // expected req 94k
  }
  else if(3100< qid <= 4700) {
    return `${process.env.REACT_APP_BACKEND_ENDPOINT3}`; // expected 94k
  }
  else{
       return `${process.env.REACT_APP_BACKEND_ENDPOINT4}`;                           //82k
  }
}

export default getEndpoint;