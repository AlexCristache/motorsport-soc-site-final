setTimeout(function unblur(){
  if(document.getElementById("turometer")) {
    document.getElementById("turometer").style.display = "none";
  }
  document.getElementById("content").classList.remove("blur");
},2000);
