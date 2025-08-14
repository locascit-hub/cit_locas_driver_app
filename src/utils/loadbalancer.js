function getEndpoint() {
  const qid=parseInt(localStorage.getItem('sno'));
  const token= localStorage.getItem('test');
  if(qid<= 1500) {
    return `${process.env.BACKEND_ENDPOINT1}`; //expected req 90k
  } else if(1500< qid <= 3100) {
       return `${process.env.BACKEND_ENDPOINT3}`;                         // expected req 94k
  }
  else if(3100< qid <= 4700) {
    return `${process.env.BACKEND_ENDPOINT3}`; // expected 94k
  }
  else{
       return `${process.env.BACKEND_ENDPOINT4}`;                           //82k
  }
}