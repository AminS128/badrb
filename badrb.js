
/**
 * BadRB: Bad RigidBody (2D)
    * Homemade for academic purposes, completely from scratch (in JS so not too impressive)
    * It kind of works and is kind of stable
 * 
 * Usage:
    * RigidSystem: an object which manages a system of RigidBody objects
        * new RigidSystem(list: RigidBody[])
        * rbSystem.iterate(); rbSystem.draw(); for manual control
        * RigidSystems have a .physics attribute which is an object with a bunch of settings; read about them at about line 450
        * For a more basic system, rbSystem.start(fps, ctx) will run a sim and display it to a canvas' context, can be halted with rbSystem.halt()
        * rbSystem.overrideDraw(function) will replace the .draw(ctx) call with the passed function, which should take arguments for the ctx and the RigidSystem object (ctx, this)
        * RigidSystem calls .onIterate(deltaTime) every iteration after physics, which is empty but can be used.
    * 
    * RigidBody: an individual physics object, defined by a 'mesh' of its vertices
        * new RigidBody(x: num, y: num, mesh: num[][]); ex: new RigidBody(90, 100, [[0, -50], [-40, 40], [80, 80]])
        * all RigidBody objects call .onCollision(otherRB) on collision with another RB. This can be used.
 */




/**
 * rigidbody stored as collection of points, where each point is an offset from the center of mass
 * center of mass position is stored
 * rotation of body is stored
 * velocity, angular velocity is stored
*/

function RigidBody(x, y, mesh=[// default mesh = square side length 100
    [-50, -50], [50, -50], [50, 50], [-50, 50]
]){
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.rot = 0
    this.vr = 0
    this.mesh = mesh
    this.space = [] // positions of each mesh point in actual space
    this.forces = [] // to be updated by frame
    this.extraforces = [] // added by others for newtons third law

    this.atRestTimer = 0 // only has effect if (physics.freezing.enabled)
    this.action = [1000,1000,1000] // alternate freezing method

    this.offsets = [] // how much a point should get jiggled; decays exponentially, added to linearly
    this.temp = null

    for(var i = 0; i < this.mesh.length; i ++){
        this.space.push([0,0])
        this.forces.push([0,0])
        this.offsets.push(0)
    }

    this.radius = 0
    this.mesh.forEach((value)=>{// get max dist from origin, save as radius
        let dist = Math.sqrt(value[0]*value[0]+value[1]*value[1])
        if(dist>this.radius){this.radius=dist}})

    this.mass = this.radius*this.radius * 0.001
    this.rotinertia = this.mass * 50000 // can be overridden if youre an absolute nerd

    this.onCollision = null // run on collision with another rigidbody

    this.bounds=[0,0,0,0]// space bounds for distance checking

    this.recalculate()
}

RigidBody.prototype.draw = function(ctx, drawStyle = {stroke:"#000000",fill:"#ffffff"}, offsets = {x:0,y:0,scaleX:1,scaleY:1}){
    // draw function, very basic for builtin functionality
    
    ctx.lineWidth = 2// make this adjustable idk

    ctx.beginPath()
    ctx.strokeStyle=drawStyle.stroke
    ctx.fillStyle = drawStyle.fill

    const cx = (offsets.x)*offsets.scaleX
    const cy = (offsets.y)*offsets.scaleY

    ctx.moveTo(this.space[0][0]*offsets.scaleX + cx, this.space[0][1]*offsets.scaleY + cy)
    for(var i = 0; i < this.mesh.length; i ++){
        ctx.lineTo(this.space[i][0]*offsets.scaleX + cx, this.space[i][1]*offsets.scaleY + cy)
    }

    ctx.closePath()

    ctx.stroke()
    ctx.fill()

    // // debug: show origin point (not center of mass, but first vertex)
    // // debug: if frozen, origin point is blue
    // ctx.fillStyle=this.atRestTimer > this.physics.freezing.timeReq ? "#00ffff" : "#ff0000"
    // ctx.fillRect(this.space[0][0]+2, this.space[0][1]+2,-4,-4)
    // // debug: display action
    // ctx.textAlign='center'
    // ctx.font="10px monospace"
    // ctx.fillText(
    //     `${Math.trunc(this.action[0]/this.mesh.length)} ${Math.trunc(this.action[1]*this.physics.freezing.vertActionMult/this.mesh.length)} ${Math.trunc(this.action[2]/this.mesh.length)}`, this.x, this.y)
    // ctx.fillText(Math.trunc(this.atRestTimer*100)/100, this.x, this.y+10)
    // // debug: display last overall[1]
    // ctx.fillText(Math.trunc(this.temp*10)/10, this.x, this.y + 10)
}

RigidBody.prototype.recalculate = function(){
    // updates this.space with new positions of the points in the mesh
    const a = Math.cos(this.rot)
    const b = Math.sin(this.rot)
    for(var i = 0; i < this.mesh.length; i ++){
        this.space[i] = [
            // matrix rotation for efficiency or whatever
            this.x + (this.mesh[i][0]*a + this.mesh[i][1]*-b),
            this.y + (this.mesh[i][0]*b + this.mesh[i][1]* a)
        ]
    }
    this.bounds[0]=this.space[0][0];this.bounds[1]=this.space[0][0];
    this.bounds[2]=this.space[0][1];this.bounds[3]=this.space[0][1];
    if(this.physics){
        // random +/- physics.inexact to keep things from being deterministic and weird w/ perfectly matched meshes
        for(var i = 0; i < this.space.length; i ++){
            // if(this.atRestTimer>this.physics.freezing.timeReq){this.offsets[i]=false;break}
            let mod = (this.physics.inexact+this.offsets[i])
            this.space[i][0]+=2*mod * (Math.random()-0.5)
            this.space[i][1]+=2*mod * (Math.random()-0.8)// more up than down
            this.offsets[i]*=0.8

            if(this.bounds[0]<this.space[i][0]){this.bounds[0]=this.space[i][0]}// bounds calculation
            if(this.bounds[1]>this.space[i][0]){this.bounds[1]=this.space[i][0]}
            if(this.bounds[2]<this.space[i][1]){this.bounds[2]=this.space[i][1]}
            if(this.bounds[3]>this.space[i][1]){this.bounds[3]=this.space[i][1]}
        }
    }
}

RigidBody.prototype.interactWith = function(other){

    // distance check: manhattan distance for efficiency
    // if(Math.abs(this.x-other.x)+Math.abs(this.y-other.y)>1.414*(this.radius+other.radius)){return}

    // distance check: bounds check, whether bounding squares intersect
    // if(!((Math.abs(this.x-other.x)<(this.radius+other.radius))&&(Math.abs(this.y-other.y)<(this.radius+other.radius)))){return}

    // distance check: whether bounding squares, calced per-frame intersect
    // if(!((this.bounds[0]>other.bounds[1]&&this.bounds[1]<other.bounds[0])&&
    // (this.bounds[2]>other.bounds[3]&&this.bounds[3]<other.bounds[2]))){return}

    // segmented distance check: also bounding squares, equivalent to above
    if(this.bounds[0]<other.bounds[1]){return}
    if(this.bounds[1]>other.bounds[0]){return}
    if(this.bounds[2]<other.bounds[3]){return}
    if(this.bounds[3]>other.bounds[2]){return}

    // finds if any points are inside other
    // if they are, finds desired displacement
    // sums them, torques, etc

    // sample points: all vertices + random point
    let samples = []
    this.space.forEach((value)=>{samples.push(value)})// ughhhhhhhhhh js references suck
    for(var i = 0; i < this.physics.randomSamples; i ++){
        let extra = this.getRandomPoint(8)
        if(extra){samples.push(extra)}
    }
    // if(Math.random()<0.001){console.log(samples)}

    
    for(var i = 0; i < samples.length; i ++){
        // for each sample

        let p = samples[i]
        
        if(RigidSystem.pointInside(p, other.space)){
            // console.log('collision')

            // point is inside other
            // find closest line to point

            // get line equation in ax + by + c = 0
            // where m is slope
            // a = -m, b = 1, c = y1 - mx1
            // if dx = 0, a = 1, c = -x1

            // distance is (ax2 + by2 + c)/sqrt(a^2+b^2)
            // = (-mx2 + y2 - y1-mx1)/sqrt(m^2 + 1)


            // determine closest line
            let mindiff = 1e10 // arbitrary large number
            let minind = 0

            for(var ii = 0; ii < other.mesh.length; ii ++){// todo make this affected by segments
                let p1 = other.space[ii]
                let ind = ii+1 < other.mesh.length ? ii + 1 : 0 // next point (cycles)
                let p2 = other.space[ind]
                let dx = p2[0]-p1[0]
                let dy = p2[1]-p1[1]

                //check whether the projection of this point onto the line falls outside the segment size
                //projba = (a.b / b.b)*b
                // if a.b/b.b is between 0 and 1, then it falls 'within' the vector, otherwise it does not
                // using bounds -0.2 to 1.2 to make concavity nicer
                // if b is [dx, dy] then that defines the line segment
                // and a is p-p1
                let projnum = (p[0]-p1[0]) * dx + (p[1]-p1[1]) * dy // the numerator only, and checked against -0.2 and 1.2 * denominator (efficiency)
                let mult = dx*dx+dy*dy
                if(!(-0.2*mult < projnum && projnum < 1.2*mult)){// if not within
                    // console.log('not within')
                    continue}

                let m = dy/dx
                let dist = Math.abs(// symbol soup 'v'
                    (-m*p[0]+p[1]-p1[1]+m*p1[0])/
                    Math.sqrt(m*m+1))

                if(dist < mindiff + this.physics.nonOptimalFaceThreshold){
                    if(mindiff-dist < this.physics.nonOptimalFaceThreshold){
                        if(Math.random()<0.5){continue}
                    }
                    mindiff = dist
                    minind = ii
                }
            }

            // console.log('intersection:', mindiff, minind)

            // repulsion vector is vector from p1 to p minus proj(p2-p1) of the same
            if(mindiff < 1e10){
                let p1 = other.space[minind]
                let p2 = other.space[(minind+1)%other.space.length]
                let dx = p2[0]-p1[0]
                let dy = p2[1]-p1[1]
                let v = [p[0]-p1[0], p[1]-p1[1]]
                let projfactor = ((v[0]) * dx + (v[1]) * dy)/(dx*dx+dy*dy)// a.b/b.b
                let repulse = [v[0] - projfactor*dx, v[1] - projfactor*dy]

                if(this.physics.squaredCollisions){
                    let magnitude = Math.sqrt(dx*dx+dy*dy)
                    repulse[0]*=magnitude
                    repulse[1]*=magnitude
                }

                const factor = -0.8 - (this.offsets[i]*this.physics.offsetStrength||0)

                repulse[0]*=factor
                repulse[1]*=factor

                if(i < this.forces.length){// if this is a vertex sample
                    this.forces[i] = [
                        (this.forces[i] || [0,0])[0] + repulse[0],
                        (this.forces[i] || [0,0])[1] + repulse[1],
                    ]
                }else{// if this is a random sample/extraneous
                    this.extraforces.push([
                        [p[0]-this.x, p[1]-this.y],[repulse[0],repulse[1]]
                    ])

                    let min = 0
                    let mindist = 10000
                    for(var ii = 0; ii<this.space.length; ii++){
                        let dx = this.space[ii][0]-p[0];let dy = this.space[ii][1]-p[1]
                        let dist = dx*dx+dy*dy
                        if(mindist>dist){mindist=dist;min=ii}
                    }
                    this.offsets[min] += this.physics.inexactJiggle // make closest vertex jiggle
                }
                other.extraforces.push([
                    [p[0]-other.x, p[1]-other.y],[-repulse[0],-repulse[1]]
                ])

                if(this.onCollision){this.onCollision(other)}
            }


            
        }

    }
}

RigidBody.prototype.getRandomPoint = function(attempts = 8){// gives a random point inside, limited on amount of attempts allowed
    let a = 0

    let randPoint = [this.bounds[1] + Math.random()*(this.bounds[0]-this.bounds[1]),// random point inside square bounds
                     this.bounds[3] + Math.random()*(this.bounds[2]-this.bounds[3])]
    let valid = RigidSystem.pointInside(randPoint, this.space)
    while(!valid){
        a++
        randPoint = [this.bounds[1] + Math.random()*(this.bounds[0]-this.bounds[1]),// random point inside square bounds
                     this.bounds[3] + Math.random()*(this.bounds[2]-this.bounds[3])]
        valid = RigidSystem.pointInside(randPoint, this.space)
        if(valid){break}
        if(a >= attempts){
            if(!valid){return null}else{break}
        }
    }
    return randPoint
}

RigidBody.prototype.update = function(deltaTime = 0.0166){
    // do forces stuff, after they have been calculated via interactWith in rigidSystem
    

    let torque = 0

    let hitsWalls = 0

    for(var i = 0; i < this.space.length; i ++){// bounds
        if(this.space[i][0] < this.physics.boundsExtra){
            const force = (this.space[i][0]-this.physics.boundsExtra)*this.physics.boundsMultiplier
            this.forces[i][0] += this.physics.squaredCollisions ? (force*force):force
            hitsWalls += force
        }
        if(this.space[i][0] > this.physics.bounds.x-this.physics.boundsExtra){
            const force = -(this.physics.bounds.x-this.physics.boundsExtra - this.space[i][0])*this.physics.boundsMultiplier
            this.forces[i][0] += this.physics.squaredCollisions ? -(force*force):-force
            hitsWalls += force
        }
        if(this.space[i][1] < this.physics.boundsExtra){
            const force = (this.space[i][1]-this.physics.boundsExtra)*this.physics.boundsMultiplier
            this.forces[i][1] += this.physics.squaredCollisions ? force*force:force
            hitsWalls += force
        }
        if(this.space[i][1] > this.physics.bounds.y-this.physics.boundsExtra){
            const force = -(this.physics.bounds.y-this.physics.boundsExtra - this.space[i][1])*this.physics.boundsMultiplier
            this.forces[i][1] += this.physics.squaredCollisions ? -force*force:-force
            hitsWalls += force
        }
    }

    if(hitsWalls > this.physics.frictionThreshold){
        this.vx *= this.physics.friction
        this.vy *= this.physics.friction
        this.vr *= this.physics.friction
    }

    let overall = [0,0]

    // console.log(this.forces)
    // over all forces

    for(var i = 0; i < this.forces.length;i++){
        if((this.forces[i][0] == 0 && this.forces[i][1] == 0)){continue}
        let dist = Math.sqrt(this.mesh[i][0]*this.mesh[i][0] + this.mesh[i][1]*this.mesh[i][1]) // from center of mass (mesh 0,0)
        let angle = Math.atan2(this.mesh[i][1], this.mesh[i][0]) + this.rot// angle from center of mass
        let fangle = Math.atan2(this.forces[i][1], this.forces[i][0])// force angle
        let tfactor = Math.sin(fangle-angle) // torque factor (t = f sin theta)
        let fstrength = Math.sqrt(this.forces[i][0]*this.forces[i][0]+this.forces[i][1]*this.forces[i][1])
        torque += tfactor * fstrength * dist

        // tfactor is sin of angle between space vector of point and force vector
        // dot product /|u||v| = (cos theta)
        // u = space - position, v = force
        // |u| and |v| already calculated
        // torque is also just |(v-proju(v))|*|u|...
        // where proju(v) = ((u.v)/|u||u|)u
        // which, for tv = v-proju(v), is just sqrt((tv.x^2+tv.y^2)(u.x^2+u.y^2))...
        // ie one division and one sqrt for this whole business

        // let u = [this.space[i][0]-this.x,this.space[i][1]-this.y]
        // let v = this.forces[i]
        // let ums = u[0]*u[0]+u[1]*u[1]// u magn. sq.
        // let projm = (u[0]*v[0]+u[1]*v[1])/ums // proj mult (u.v)/(|u|^2)
        // let tv = [v[0]-u[0]*projm, v[1]-u[1]*projm]// torque vector
        // let tm = Math.sqrt(tv[0]*tv[0]+tv[1]*tv[1]) // torque mag
        // let um = Math.sqrt(ums)
        
        // let sign = 1 // find sign
        // // cos theta between u/um and (1,0), and between tv/tm and (1,0), while not dividing by magnitudes,
        // // is just their x coordinates - when doing comparisons, will multiply by magnitudes on opposites rather
        // // than do the divisions

        // // if cos tv = 0, clockwise iff tv.y > 0, u.x < 0, or tv.y < 0, u.x > 0
        // // if cos u < cos tv, clockwise iff u is between 45 and 135 degrees (u.y > u.x)
        // // if cos u > cos tv, clockwise iff u is not between those degrees?

        // if(tv[0]==0){
        //     if(tv[1]>0){sign*=-1}if(u[0]>0){sign*=-1}
        // }else{
        //     if(u[0]*tm > tv[0]*um){sign*=-1}
        //     if(u[1]>u[0]){sign*=-1}
        // }

        // torque += um * tm * sign

        overall[0] += this.forces[i][0]
        overall[1] += this.forces[i][1]

        this.forces[i] = [0,0]
    }
    for(var i = 0; i < this.extraforces.length; i ++){
        const f = this.extraforces[i]
        const fp = f[0]
        const ff = f[1]
        let dist = Math.sqrt(fp[0]*fp[0] + fp[1]*fp[1]) // from center of mass (mesh 0,0)
        let angle = Math.atan2(fp[1], fp[0])// angle from center of mass
        let fangle = Math.atan2(ff[1], ff[0])// force angle
        let tfactor = Math.sin(fangle-angle) // torque factor (t = f sin theta)
        let fstrength = Math.sqrt(ff[0]*ff[0]+ff[1]*ff[1])
        torque += tfactor * fstrength * dist

        // console.log(angle, fangle, tfactor)

        overall[0] += ff[0]
        overall[1] += ff[1]
    }

    this.extraforces = []

    // this.vy += this.physics.grav * deltaTime
    overall[1] += this.physics.grav * this.mass
    
    this.vr += (torque / this.rotinertia)*deltaTime
    this.vx += (overall[0]/this.mass)*deltaTime
    this.vy += (overall[1]/this.mass)*deltaTime

    this.temp = overall[1]
    
    // at rest management
    if(this.physics.freezing.enabled){
        switch(this.physics.freezing.style){
            case 0 :
                this.action[0]*=this.physics.freezing.actionDecay
                this.action[0]+=3*this.vx
                this.action[0]+=overall[0]/this.mass
                this.action[1]*=this.physics.freezing.actionDecay
                this.action[1]+=this.vy*10
                this.action[1]+=overall[1]/this.mass
                this.action[2]*=this.physics.freezing.actionDecay
                this.action[2]+=this.vr * 2000// vrot should be more significant
                this.action[2]+=this.physics.freezing.torqueMult * torque / this.rotinertia
                if(
                    Math.abs(this.action[0])+Math.abs(this.action[1]*this.physics.freezing.vertActionMult)+Math.abs(this.action[2])
                    <this.physics.freezing.actionThreshold*this.mesh.length){
                    this.atRestTimer+=deltaTime
                }else{
                    this.atRestTimer = 0
                }
                break
            case 1 :
                // console.log((Math.abs(this.vx)+Math.abs(this.vy)+50*Math.abs(this.vr))/deltaTime)
                if(// vr has coeff. of 50 because its always much smaller
                    Math.abs(this.vx)+Math.abs(this.vy)+50*Math.abs(this.vr) < this.physics.freezing.threshold*deltaTime
                ){
                    this.atRestTimer += deltaTime
                }else{
                    // console.log(this.vx,this.vy)
                    this.atRestTimer = 0
                }

                if(Math.abs(overall[0])+Math.abs(overall[1]) >
                 this.physics.freezing.disturbThreshold * this.mesh.length){
                    this.atRestTimer = 0
                }
                break
        }
        
        // at rest = no forces applied, no velocity applied
        if(this.atRestTimer > this.physics.freezing.timeReq){
            this.vx = 0
            this.vy = 0
            this.vr = 0
            this.x += (overall[0]*deltaTime)*0.2
            this.y += ((overall[1]*deltaTime)/*- (this.physics.grav * this.mass * deltaTime)*/)*0.2
            this.r += 100*(torque*deltaTime)/this.rotinertia
            this.recalculate()
            return
        }
    }

    
    this.x += (overall[0]*deltaTime)*this.physics.positionMult
    this.y += (overall[1]*deltaTime)*this.physics.positionMult//- (this.physics.grav * this.mass * deltaTime)

    this.rot += this.vr
    this.x += this.vx*deltaTime
    this.y += this.vy*deltaTime

    const factor = (1 - this.physics.dragFactor*deltaTime)

    this.vx *= factor
    this.vy *= factor
    this.vr *= factor

    this.recalculate()
}

function RigidSystem(list){

    this.rblist = list

    this.selfTimer = null

    this.paused = false // true if all bodies are at rest

    this.physics = {// PHYSICS SETTINGS (to taste) =================================================================
        fps:60,
        bounds:{x:512,y:512},// assumed that 0,0 -> x,y is bounding rect within which system resides
        boundsExtra:2,// like the opposite of margin (ie 5 means bounds collisions begin 5 pixels earlier than actual bounds)
        grav:2,
        dragFactor:0.05,
        nonOptimalFaceThreshold:0.5,// threshold under which a non-minimum displacement distance might be accepted
        squaredCollisions:true, // whether or not collision magnitude should be squared (true => nicer collisions)
        boundsMultiplier:2,// force multiplier on bounds
        randomSamples:2,// number of additional samples (in addition to vertices)
        substeps:32, // subframes per frame
        autoSubsteps:true,// whether or not to auto adjust substeps based on rb count
        friction:0.997,// tiny friction for anti bobbing in ground
        frictionThreshold:2,// amount of force off bounds to activate bounds friction
        positionMult:0.6,// how much of overall[] displacement should apply directly to position
        inexact:0.1,// +/- on mesh coords on rb (to keep things from intersecting from perfect matched meshes)
        inexactJiggle:2,// offset for specially jiggled vertices, like .inexact but specialized
        offsetStrength:0.5, // how much the jiggle for a corner should increase its repulsion on collision
        freezing:{// objects which are ''at rest'' freeze in place
            enabled:true,
            style:0,// 0: action-based, 1: velocity- and disturbance-based (not nearly as good)
            threshold:2000, // how much |velocity| below which count as 'at rest'
            timeReq:15, // how long need to be below threshold to count as at rest (seconds? not really)
            disturbThreshold:10,// how much sum(|force|)/vertex needed to break rest
            actionDecay:0.9995,// mult per frame on action
            actionThreshold:200, // action per vertex below which counts at rest
            vertActionMult:0.5,// multiplier on vertical action, since its always much higher
            torqueMult:300,// multiplier on gains from torque
        }
    }

    this.drawOverride = null

    for(var i = 0; i < this.rblist.length; i ++){
        this.rblist[i].physics = this.physics
    }
}

RigidSystem.prototype.overrideDraw = function(callback){
    this.drawOverride = callback
}

RigidSystem.prototype.add = function(rb){
    this.rblist.push(rb)
    rb.physics = this.physics
    this.paused = false
}

RigidSystem.prototype.remove = function(rb){// using this requires keeping a reference externally
    let index = this.rblist.indexOf(rb)
    if(!(index+1)){return}
    this.rblist.splice(index, 1)
    this.paused = false
}

RigidSystem.prototype.iterate = function(){

    if(this.paused){// all objects at rest
        if(Math.random()>0.05){return}// do much less computation
    }

    let substepCount = this.physics.substeps
    if(this.physics.autoSubsteps){
        if(this.rblist.length < 32){substepCount*=2}
        if(this.rblist.length < 16){substepCount*=2}
    }

    const dt = 8*(1 / this.physics.fps) / substepCount

    let canPause = this.physics.freezing.enabled

    for(var iii = 0; iii < substepCount; iii++){
        for(var i = 0; i < this.rblist.length; i ++){
            for(var ii = 0; ii < this.rblist.length; ii ++){
                if(i==ii){continue}
                this.rblist[i].interactWith(this.rblist[ii])
            }
        }
        for(var i = 0; i < this.rblist.length; i ++){
            this.rblist[i].update(dt)
            if(this.rblist[i].atRestTimer < this.rblist[i].physics.freezing.timeReq){
                canPause = false
            }
        }
    }

    if(this.onIterate){this.onIterate(dt*substepCount)}

    this.paused=canPause
}

RigidSystem.prototype.start = function(targetFPS, ctx){// .iterate()
    this.physics.fps = targetFPS
    this.selfTimer = setInterval(this._iterate, 1000 / targetFPS, 1000 / targetFPS, ctx, this)
    this.pastFrames = []// for fps counting
}
RigidSystem.prototype._iterate = function(dt, ctx, a){// used by start, etc
    const datenow = Date.now()
    for(var i = 0; i < a.pastFrames.length; i ++){
        if(datenow - a.pastFrames[i] > 1000){a.pastFrames.splice(i,1)}
    }
    a.iterate()
    a.draw(ctx)

    a.pastFrames.push(datenow)

    // a.selfTimer = setTimeout(a._iterate, dt, dt, ctx, a)
}
RigidSystem.prototype.halt = function(){
    clearTimeout(this.selfTimer)
}

RigidSystem.prototype.draw = function(ctx){
    if(this.drawOverride!=null){this.drawOverride(ctx, this);return}
    ctx.fillStyle="#888888"
    ctx.fillRect(0, 0, this.physics.bounds.x, this.physics.bounds.y)
    for(var i = 0; i < this.rblist.length; i ++){
        this.rblist[i].draw(ctx)
    }
    ctx.fillStyle = "#55ff55"// fps display
    ctx.fillText(this.pastFrames.length, 10, 20)
    // visual: draw bounding shapes
    // for(var i = 0; i < this.rblist.length; i ++){
    //     ctx.fillStyle = '#ff00ff33'
    //     const rbiq = this.rblist[i] // rigid body in question
    //     ctx.fillRect(rbiq.x-rbiq.radius, rbiq.y-rbiq.radius, rbiq.radius*2, rbiq.radius*2)// bounding squares
        
    //     // ctx.beginPath()// bounding circles
    //     // ctx.arc(rbiq.x, rbiq.y, rbiq.radius+1, 0, 6.288)
    //     // ctx.closePath()
    //     // ctx.fill()
    // }
}


// let counter = 0 // pointInside is run 400k a second
// let start = Date.now()
RigidSystem.pointInside = function(point, mesh){// returns if point is inside mesh or not
    let p = point
    let tally = 0
    for(var i = 0; i < mesh.length; i++){
            // checks if line from point to infinite right (going to +x) intersects

            // for each point in other
            let p1 = mesh[i]
            let ind = i+1 < mesh.length ? i + 1 : 0 // next point (cycles)
            let p2 = mesh[ind]
            let dx = p2[0]-p1[0]
            let dy = p2[1]-p1[1]
            
            // if(p[0] >= Math.max(p1[0], p2[0])){ // too far to the right
            if(p[0]>p1[0]&&p[0]>p2[0]){
                // console.log(i,ii,'a') // working
                continue}
            if(Math.abs(p[1] - 0.5*(p1[1]+p2[1])) >= Math.abs(0.5*dy)){// not within y bounds
            // if(p[1] > Math.max(p1[1],p2[1]) || p[1] < Math.min(p1[1],p2[1])){
                // console.log(i,ii,'b')// working
                continue}

            if(dx!=0){
                let m = dy/dx
                let pdx = p[0]-p1[0]
                let ly = pdx*m+p1[1]
                if(
                    (ly > p[1] && m > 0) ||
                    (ly < p[1] && m < 0)
                ){
                    // console.log(i,ii,'c')// working
                    continue}
            }

            tally ++

        }
        // counter++
        return tally % 2 != 0
}