
// demo: frustrated birds
// low-quality, proof-of-concept implementation of the well-known classic using BadRB

rbsystem.overrideDraw((ctx, rbs)=>{

    ctx.fillStyle="#111111"
    ctx.fillRect(rbs.physics.bounds.x, 0, c.width, c.height)
    ctx.fillRect(0, rbs.physics.bounds.y, c.width, c.height)

    ctx.fillStyle="#222222aa"
    ctx.fillRect(0, 0, rbs.physics.bounds.x, rbs.physics.bounds.y)
    
    
    ctx.fillStyle="#444444"
    ctx.font="20px monospace"
    ctx.textAlign='center'
    ctx.fillText("Drag to throw", 530, 490)
    ctx.font="30px impact"
    ctx.fillText("Frustrated", 250, 333)
    ctx.fillText("Birds", 250, 373)

    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, 10, 0, 6.28)
    ctx.closePath();ctx.fill()
    if(mouse.click){
        // ctx.beginPath()
        // ctx.lineWidth=3
        // ctx.strokeStyle="#333333"
        // ctx.moveTo(mouse.down.x,mouse.down.y)
        // let vx = (mouse.x-mouse.down.x)/10;let vy=(mouse.y-mouse.down.y)/10
        // let x = mouse.down.x; let y = mouse.down.y
        // for(var i = 0;i<30;i++){
        //     x += vx; y += vy; vy+=1.70+Math.random()*0.3
        //     vx*=1-Math.random()*0.08;vy*=0.99
        //     if(x>rbs.physics.bounds.x||y>rbs.physics.bounds.y){break}
        //     ctx.lineTo(x, y)
        // }
        // ctx.stroke()
        // ctx.closePath()

        ctx.beginPath()
        ctx.arc(mouse.down.x, mouse.down.y, 10, 0, 6.28)
        ctx.closePath();ctx.fill()
    }

    for(var i = 0; i < blocks.length; i ++){
        let rbiq = blocks[i].rb // rb in question
        let stroke = blocks[i].rb.atRestTimer > blocks[i].rb.physics.freezing.timeReq ? "#00ffdd": "#00ffaa"
        switch(blocks[i].damage){
            case 1:stroke="#aaddaa";break
            case 2:stroke="#ddff88";break
            case 3:stroke="#ffaa66";break}
        rbiq.draw(ctx, {
            stroke:stroke,
            fill:"#333333"
        })
    }
    for(var i = 0; i < birds.length; i ++){
        let rbiq = birds[i].rb
        rbiq.draw(ctx, {
            stroke:"#00ffaa",
            fill:"#333333"
        })
    }



})

rbsystem.onIterate = (dt)=>{
    for(var i = 0; i < birds.length; i ++){
        birds[i].age+=dt
        
        birds[i].rb.atRestTimer = 0
        if(birds[i].age > 30){
            toRemove.push(birds[i].rb)
        }
    }
    for(var i = 0; i < blocks.length; i++){
        let vel = Math.abs(blocks[i].rb.vx) + Math.abs(blocks[i].rb.vy) // manhattan veloctiy for efficeincy
        blocks[i].velAction+=vel
        blocks[i].velAction*=0.8
        blocks[i].age+=dt
        if(blocks[i].velAction-vel*5 > 3 && blocks[i].age>10){blocks[i].damage++;blocks[i].velAction=vel*5}
        if(blocks[i].damage > 3){toRemove.push(blocks[i].rb)}
    }
    while(toRemove.length>0){
        rbsystem.remove(toRemove[0])
        for(var i = 0; i < blocks.length; i ++){
            if(blocks[i].rb==toRemove[0]){blocks.splice(i,1)}
        }
        for(var i = 0; i < birds.length; i ++){
            if(birds[i].rb==toRemove[0]){birds.splice(i,1)}
        }
        toRemove.splice(0,1)
    }
}

let a = 0

let blocks = []
for(var i = 0; i < rbsystem.rblist.length; i ++){
    blocks.push({rb:rbsystem.rblist[i],damage:0,velAction:100,age:0})
}

let mouse = {x:-10,y:-10,down:{x:-10,y:-10},click:false}

c.addEventListener('mousemove', (e)=>{
    mouse.x=e.offsetX
    mouse.y=e.offsetY
})

c.addEventListener('mousedown', (e)=>{
    mouse.down = {x:e.offsetX, y:e.offsetY}
    mouse.click = true
})

c.addEventListener('mouseout',()=>{mouse.down={x:-10,y:-10},mouse.click=false})

c.addEventListener('mouseup', (e)=>{
    if(mouse.down.x<0||mouse.down.y<0){mouse.click=false;return}
    let dx = mouse.x-mouse.down.x
    let dy = mouse.y-mouse.down.y
    if(Math.sqrt(dx*dx+dy*dy)<20){
        // repulseObjects(mouse.x, mouse.y)
    }else{
        createBird(mouse.down.x, mouse.down.y, dx/10, dy/10)
    }
    mouse.click = false
})

let toRemove = []

function createBird(x,y,vx,vy){
    let newrb = RBsamples.createAngryBird(x, y, 10, Math.atan2(vy,vx))
    newrb.vx = vx
    newrb.vy = vy
    newrb.onCollision = function(other){
        if(Math.sqrt(this.vx*this.vx+this.vy*this.vy)>20){
            this.vx*=0.5;this.vy*=0.5
            toRemove.push(other)
        }
    }
    birds.push({rb:newrb, age:0})
    rbsystem.add(newrb)
}

let birds = []

function repulseObjects(x,y){
    // repulse
    for(var i = 0; i < rbsystem.rblist.length; i ++){
        let rbiq = rbsystem.rblist[i]
        let dx = x-rbiq.x;let dy = y-rbiq.y
        let dist = Math.sqrt(dx*dx+dy*dy)
        let forcemag = Math.max(0, 100-dist)
        let OOADXPADY = 1/(Math.abs(dx)+Math.abs(dy))// one over abs dx plus abs dy
        rbiq.vx += -(dx*OOADXPADY)*forcemag
        rbiq.vy += -(dy*OOADXPADY)*forcemag
        rbiq.atRestTimer = 0
    }
}