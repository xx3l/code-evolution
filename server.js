const express = require('express');
const app = express();
app.set('view engine', 'pug');

const ws = require('ws');

const wsSrv = new ws.Server({ noServer: true });
wsSrv.on('connection', socket => {
  socket.on('message', message => console.log(message.toString()));
});

const weatherDelay = 100;
const aliveDelay = 50;


//const users = ['aj', 'cn', 'db', 'ds', 'dt', 'is', 'kn', 'nn', 'ta', 'za'];
//const users = ['aj', 'az', 'dd', 'lv', 'ma', 'pm'];
const users = ['app1'];

//const path = (user) => `/home/${user}/app`; // path for ~user/app/app.js for student's home dirs
const path = (user) => `./${user}`;

const backlog = (user, msg) => {
  try {
    require('fs').appendFileSync(`${path(user)}/app.log`, msg+'\n');
  } catch (e) {
    console.log(`Writing backlog error for ${user}`, e.toString());
  }
  console.log(`${user} -> ${msg}`);
}

const load_protos = () => {
  const obj_protos = {};
  for (user of users) {
    if (obj_protos[user]) continue;
    try {
      const obj = require(`${path(user)}/app.js`).getIt();
      if (!["herb"].includes(obj.type)) {
        backlog(user, `Error: ${user} - unknown type of Object`);
        continue;
      }
      if (obj.params.roots + obj.params.health > 10) {
        backlog(user, `Error: ${user} - wrong initial params sum`);
        continue;
      }
      if (obj.params.roots <= 0 || obj.params.health <= 0) {
        backlog(user, `Error: ${user} - negative params`);
        continue;
      }
      obj_protos[user] = obj;
      console.log(`... user ${user} loaded ...`);
    } catch (e) {
      backlog(user, `${user} loading error`, e.toString());
    }
  }
  return obj_protos;
}

const obj_protos = load_protos();

let objs = [];
for (const k in obj_protos) {
  const el = {...obj_protos[k]};
  el.name = k;
  el.proto = { 
    params: {...el.params}, 
    name: el.name
  };
  objs.push(el)
}

const world = {
  temp: 0,
  epoch: 0
}
setInterval(() => {
  world.temp = Math.sin(world.epoch/1337) * 20 + 10; 
}, weatherDelay);

setInterval(() => {
  world.epoch++;
  new_objs = [];
  for (const obj of objs) {
    let d_roots = (Math.random() - 0.4)/5;
    obj.params.roots += d_roots;
    let d_health = world.temp < 10 ? -0.1 : -0.01;
    obj.params.health += d_health;
    if (obj.params.health < 0) {
      objs = objs.filter(el => el != obj);
      continue;
    }
    if (obj.params.health > 10 && Math.random() > 0.99) {
      const new_obj = {...obj};
      new_obj.name = new_obj.name + '->' + new_obj.proto.name;
      new_obj.params = {...new_obj.proto.params};
      new_obj.state.params = {...new_obj.proto.params};
      new_objs.push(new_obj);
      console.log(`spawned ${new_obj.name}`, new_obj, new_obj.params);
    }

    const worldInteract = (obj) => {
      return {
        roots2health: (n) => {
          if (obj.params.roots < n) {
          console.log(user, `Не переносим ${n} ${user} в здоровье`);
            return false;
          }
          obj.params.roots -= n;
          obj.params.health += n;
          console.log(`Переносим ${n} ${obj.name} в здоровье`);
          return true;
        },
      }
    }
    obj.state.params = {...obj.params};
    try {
      obj.code.timeStep(obj.state, worldInteract(obj));
    } catch (e) {
      backlog(obj.name, e.toString())
    }
  }
  objs.push(...new_objs);
}, aliveDelay);

app.get("/", function(req, res) {
  res.render('index',{ objs, world });
})

webSrv = app.listen(4000);
webSrv.on('upgrade', (request, socket, head) => {
  wsSrv.handleUpgrade(request, socket, head, socket => {
    wsSrv.emit('connection', socket, request);
  });
});
