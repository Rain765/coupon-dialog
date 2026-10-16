// Run this function with playwright-cli run-code on the served demo page.
async (page) => {
  const result = [];
  const check = (ok, name) => { if (!ok) throw new Error(name); result.push(name); };
  const base = 'http://127.0.0.1:8765/reward-motion-v2/index.html';
  await page.goto(base);
  await page.waitForTimeout(2400);
  const initial = await page.evaluate(() => ({
    title: document.querySelector('.reward-card h2').textContent,
    copy: document.querySelector('#reward-sub').innerText,
    label: document.querySelector('.coupon-tag').textContent,
    button: document.querySelector('#claim').textContent,
    deadline: document.querySelector('#coupon-countdown').dateTime,
    time: document.querySelector('#coupon-countdown').textContent,
    enabled: !document.querySelector('#claim').disabled,
  }));
  check(initial.title === 'Welcome back!' && initial.label === 'Repayment discount' && /^\d{2}d \d{2}h \d{2}m \d{2}s$/.test(initial.time) && initial.button === 'Apply now' && initial.copy === 'Pay on time\nand reduce your loan cost', 'approved copy');
  check(initial.enabled, 'animation unlock');
  await page.reload(); await page.waitForTimeout(2400);
  check(await page.locator('#coupon-countdown').getAttribute('datetime') === initial.deadline, 'reload preserves deadline');
  await page.locator('#replay').click(); await page.waitForTimeout(2400);
  check(await page.locator('#coupon-countdown').getAttribute('datetime') === initial.deadline, 'replay does not renew countdown');
  const checks = await page.evaluate(async () => {
    const api = window.RewardCoupon, $ = s => document.querySelector(s);
    const checks = []; const test = (ok, name) => { if (!ok) throw new Error(name); checks.push(name); };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    // Deliberately differ from device time to verify server-clock use.
    const n = Date.now() + 86400000;
    const c = {id:'test',amount:50,eligible:true,status:'available',serverNow:n,expiresAt:n+120000};
    const settings = {lowPerformance:true,onApply:()=>{}};
    test(await api.show(c,settings), 'server-time eligible show');
    test($('#reward-amount').textContent === '50' && !$('#claim').disabled && !$('#screen').classList.contains('is-playing'), 'dynamic amount/static mode');
    test($('#coupon-days').textContent==='00'&&$('#coupon-hours').textContent==='00'&&$('#coupon-minutes').textContent==='01', 'server clock used');
    await api.show({...c,expiresAt:n+90061900},settings);
    test($('#coupon-countdown').textContent==='01d 01h 01m 01s','day-hour-minute-second decomposition');
    await wait(2100);
    test($('#coupon-countdown').textContent==='01d 01h 00m 59s','seconds tick and minute rollover');
    await api.show({...c,expiresAt:n+86400900},settings);
    await wait(1100);
    test($('#coupon-days').textContent==='00'&&$('#coupon-hours').textContent==='23'&&$('#coupon-minutes').textContent==='59'&&$('#coupon-seconds').textContent==='59','day rollover');
    await api.show({...c,expiresAt:n+3600100},settings);
    test($('#coupon-hours').textContent==='01','hour display before boundary');await wait(1100);
    test($('#coupon-hours').textContent==='00'&&!$('#screen').classList.contains('is-used'),'hour boundary updates without early expiry');
    for (const patch of [{eligible:false},{status:'bound'},{amount:0},{amount:'25'},{amount:10000},{expiresAt:n},{id:''},{serverNow:null}]) {
      test(await api.show({...c,...patch},settings) === false && $('#screen').classList.contains('is-used') && $('#claim').disabled, 'reject '+JSON.stringify(patch));
    }
    await api.show({...c,expiresAt:n+100},settings);await wait(1100);
    test($('#screen').classList.contains('is-used') && $('#claim').disabled,'expiry static closes');
    await api.show({...c,expiresAt:n+100},{onApply:()=>{}});await wait(1100);
    test($('#screen').classList.contains('is-used') && $('#claim').disabled,'expiry during animation closes');
    let calls=0,resolveApply;
    await api.show(c,{lowPerformance:true,onApply:()=>{calls++;return new Promise(r=>resolveApply=r)}});
    $('#claim').click();$('#claim').click();
    test(calls===1&&$('#claim').disabled,'duplicate apply blocked');
    test(await api.replay()===false,'no replay during apply');
    await api.show({...c,id:'new',amount:100},settings);resolveApply();await wait(0);
    test(!$('#screen').classList.contains('is-used')&&$('#reward-amount').textContent==='100','old apply cannot close replacement');
    let errorEvent=false;$('#screen').addEventListener('couponapplyerror',()=>errorEvent=true,{once:true});
    await api.show(c,{lowPerformance:true,onApply:()=>Promise.reject(new Error('test rejection'))});$('#claim').click();await wait(0);
    test(errorEvent&&!$('#claim').disabled&&!$('#screen').classList.contains('is-used'),'failed apply restores valid coupon');
    await api.show(c,{lowPerformance:true});test($('#claim').disabled,'missing handler disables apply');
    await api.show(c,settings);$('#claim').click();await wait(0);
    test($('#screen').classList.contains('is-used')&&$('#applied-coupon').hidden,'apply does not fake repayment discount');
    await api.show(c,settings);api.destroy();
    test(await api.show(c,settings)===false&&$('#screen').classList.contains('is-used'),'destroy prevents further updates');
    return checks;
  });
  result.push(...checks);
  // Verify production initialization never falls back to the preview fixture.
  const ctx = await page.context().browser().newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(() => { window.REWARD_COUPON_CONFIG = null; });
  const prod = await ctx.newPage();await prod.goto(base);await prod.waitForTimeout(1300);
  check(await prod.evaluate(()=>document.querySelector('#screen').classList.contains('is-used')&&document.querySelector('#amount').disabled),'production starts closed');
  await prod.emulateMedia({reducedMotion:'reduce'});
  await prod.evaluate(()=>window.RewardCoupon.show({id:'reduced',amount:100,eligible:true,status:'available',serverNow:Date.now(),expiresAt:Date.now()+60000},{onApply:()=>{}}));
  check(await prod.locator('#claim').isEnabled()&&!await prod.locator('#screen').evaluate(e=>e.classList.contains('is-playing')),'system reduced motion');
  await ctx.close();
  await page.goto(base);await page.waitForTimeout(2400);
  // Sample the unchanged CSS rotation path at 5 ms intervals, including endpoints.
  const degrees = await page.evaluate(async()=>{
    await window.RewardCoupon.replay();
    const a=document.querySelector('.reward-turn').getAnimations()[0];a.pause();if(a.effect.getTiming().duration!==600||a.effect.getTiming().delay!==600)throw new Error('rotation timing');let prev=null,total=0;
    for(let t=600;t<=1200;t+=5){a.currentTime=t;const m=new DOMMatrix(getComputedStyle(document.querySelector('.reward-turn')).transform);const angle=Math.atan2(-m.m13,m.m11)*180/Math.PI;if(prev!==null){let delta=angle-prev;while(delta>180)delta-=360;while(delta< -180)delta+=360;total+=delta}prev=angle}
    return total;
  });
  check(Math.abs(Math.abs(degrees)-180)<0.01,'half a Y-axis turn in 600ms');
  const burst = await page.evaluate(async()=>{
    const rays=[...document.querySelectorAll('.burst-ray')],first=rays[0];
    const before=rays.map(e=>e.style.cssText).join();
    await window.RewardCoupon.replay();
    const varied=before!==rays.map(e=>e.style.cssText).join();
    const sizes=rays.map(e=>parseFloat(e.style.getPropertyValue('--size')));
    const maxEnd=Math.max(...rays.map(e=>1000*(parseFloat(e.style.getPropertyValue('--delay'))+parseFloat(e.style.getPropertyValue('--life')))));
    const flight=first.querySelector('.burst-flight'), animations=[first.getAnimations()[0],flight.getAnimations()[0]];
    const points=[.2,.5,.8].map(progress=>{
      animations.forEach(a=>{a.pause();const t=a.effect.getTiming();a.currentTime=t.delay+t.duration*progress});
      const f=new DOMMatrix(getComputedStyle(flight).transform),d=new DOMMatrix(getComputedStyle(first).transform);
      return {x:f.m41,y:f.m42+d.m42};
    });
    const [a,b,c]=points,cross=Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
    const soft=rays.every(e=>parseFloat(getComputedStyle(e.querySelector('.burst-star')).filter.slice(5))>0);
    await window.RewardCoupon.replay();
    return {count:rays.length,varied,reused:document.querySelector('.burst-ray')===first,sizes,maxEnd,cross,soft};
  });
  check(burst.count===12&&burst.reused,'12 burst nodes reused on replay');
  check(burst.varied&&Math.max(...burst.sizes)/Math.min(...burst.sizes)>4,'varied burst sizes and fresh paths');
  check(burst.soft&&burst.cross>1&&burst.maxEnd<=1600,'soft curved burst finishes before card settles');
  for (const width of [320,390,1200]) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(()=>window.RewardCoupon.show({id:'layout',amount:9999,eligible:true,status:'available',serverNow:Date.now(),expiresAt:Date.now()+60000},{lowPerformance:true,onApply:()=>{}}));
    const fits = await page.evaluate(()=>{const s=document.querySelector('.screen').getBoundingClientRect(),c=document.querySelector('.reward-card').getBoundingClientRect(),p=document.querySelector('#reward-sub'),tag=document.querySelector('.coupon-tag').getBoundingClientRect();const range=document.createRange();range.selectNodeContents(p);const text=range.getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&c.bottom<=s.bottom&&p.scrollWidth<=p.clientWidth&&text.top>=tag.bottom&&document.querySelector('.reward-card h2').nextElementSibling.id==='coupon-countdown'&&getComputedStyle(document.querySelector('#coupon-hours')).fontWeight==='700'&&getComputedStyle(document.querySelector('#coupon-hours')).fontSize==='24px'&&document.querySelector('#coupon-countdown').scrollWidth<=document.querySelector('#coupon-countdown').clientWidth&&getComputedStyle(document.querySelector('#coupon-hours')).color==='rgb(29, 33, 41)'&&getComputedStyle(document.querySelector('.coupon-divider')).borderLeftStyle==='dashed'&&getComputedStyle(document.querySelector('.coupon-divider')).borderLeftWidth==='1px'&&document.querySelector('.coupon-outline path').getAttribute('vector-effect')==='non-scaling-stroke'&&document.querySelector('.coupon-ticket').getBoundingClientRect().height<112;});
    check(fits,'layout fits '+width);
    await page.locator('#device').screenshot({path:'output/playwright/recall-'+width+'.png'});
  }
  return {passed:result.length,checks:result,degrees};
}
