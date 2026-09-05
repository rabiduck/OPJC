
// UAT indicator: this code can safely be promoted because it only renders
// when the site is being viewed on a hostname containing "uat".
const currentHost=window.location.hostname.toLowerCase();
if(currentHost.includes('uat')){
  document.body.classList.add('uat-mode');
  const banner=document.createElement('div');
  banner.className='uat-banner';
  banner.setAttribute('role','status');
  banner.innerHTML='<strong>UAT</strong><span>Preview environment — not the live site</span>';
  document.body.prepend(banner);
}

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

async function loadCalendarData(){
  const eventsTarget=document.querySelector('#events-list');
  const closuresTarget=document.querySelector('#closures-list');
  if(!eventsTarget||!closuresTarget) return;

  const renderEmpty=(target,message)=>{
    target.innerHTML='<div class="empty-state">'+message+'</div>';
  };

  const formatDate=(value)=>{
    const d=new Date(value+'T12:00:00');
    return new Intl.DateTimeFormat('en-GB',{
      weekday:'short',day:'numeric',month:'short',year:'numeric'
    }).format(d);
  };

  const renderItems=(target,items,type)=>{
    if(!items.length){
      renderEmpty(target,type==='closure'?'No upcoming closures listed.':'No upcoming events listed.');
      return;
    }
    target.innerHTML=items.map(item=>{
      const location=item.location?'<div class="event-meta">'+item.location+'</div>':'';
      const description=item.description?'<p>'+item.description+'</p>':'';
      return '<article class="event-card '+type+'">'+
        '<div class="event-date">'+formatDate(item.date)+'</div>'+
        '<div class="event-body"><h3>'+item.title+'</h3>'+location+description+'</div>'+
      '</article>';
    }).join('');
  };

  try{
    const response=await fetch('assets/events.json',{cache:'no-store'});
    if(!response.ok) throw new Error('Calendar data could not be loaded');
    const data=await response.json();
    const today=new Date();
    today.setHours(0,0,0,0);
    const upcoming=(items=[])=>items
      .filter(item=>new Date(item.date+'T23:59:59')>=today)
      .sort((a,b)=>a.date.localeCompare(b.date));
    renderItems(eventsTarget,upcoming(data.events),'event');
    renderItems(closuresTarget,upcoming(data.closures),'closure');
  }catch(error){
    renderEmpty(eventsTarget,'Events are temporarily unavailable.');
    renderEmpty(closuresTarget,'Closure dates are temporarily unavailable.');
  }
}
loadCalendarData();
