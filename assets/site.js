const button=document.querySelector('.menu-toggle');
const menu=document.querySelector('#site-menu');
if(button&&menu){
  button.addEventListener('click',()=>{
    const open=menu.classList.toggle('open');
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  });
  menu.addEventListener('click',e=>{
    if(e.target.closest('a')){
      menu.classList.remove('open');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Open navigation');
    }
  });
}
