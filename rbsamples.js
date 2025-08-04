const RBsamples = {// sample rblists that can be passed to the constructor of a RigidSystem
    createSquare:function(x,y,r){
        return new RigidBody(x,y,[[-r, -r], [r, -r], [r, r], [-r, r]])
    },
    createQuad:function(x,y,r,mod){
        let nr = r-mod/2
        return new RigidBody(x,y,
            [[-(nr+Math.random()*mod), -(nr+Math.random()*mod)], [nr+Math.random()*mod, -(nr+Math.random()*mod)],
            [nr+Math.random()*mod, nr+Math.random()*mod], [-(nr+Math.random()*mod), nr+Math.random()*mod]])
    },
    createRect:function(x,y,w,h){
        return new RigidBody(x,y,[[-w/2,-h/2],[w/2,-h/2], [w/2, h/2], [-w/2, h/2]])
    },
    one:function(){return [this.createSquare(220, 320, 40),this.createSquare(200, 50, 40),
        this.createSquare(160, 405, 40),
        new RigidBody(90, 400, [[0, -50], [-40, 40], [80, 80], [50,-10],[10,30]]),
        new RigidBody(350, 100, [[0, -30], [-40, 10], [80, 30]]),
        new RigidBody(310, 400, [[0, -20], [-50, 40], [60, 80]])
    ]},
    tower:function(){return [
        this.createSquare(200, 20, 15),
        this.createSquare(200, 70, 20),
        this.createSquare(200, 170, 25),
        this.createSquare(200, 270, 30),
        this.createSquare(200, 370, 40),
        this.createSquare(200, 470, 50),]},
    randomSquares:function(amount){
        let output = []
        for(var i = 0; i < amount; i ++){
            output.push(this.createSquare(Math.random()*512, Math.random()*512, Math.random()*20+10))
        }
        return output
    },
    randomQuads:function(amount){
        let output = []
        for(var i = 0; i < amount; i ++){
            let r = Math.random()*10 + 5
            output.push(this.createQuad(Math.random()*512, Math.random()*512, r, r*1.5))
        }
        return output
    },
    createHenge:function(x, y, w, h){
        let m = 5 // margin
        let t = 25 // thickness
        return [
            this.createRect(x-w/2+m+t/2, y+t/2, t, h-t),
            this.createRect(x+w/2-m-t/2, y+t/2, t, h-t),
            this.createRect(x, y-(h-t)/2, w, t),
        ]
    },
    angryBirds:function(){// house of cards type arrangement
        let henges = 
        [
            this.createHenge(100, 460, 100, 100),this.createHenge(200, 460, 100, 100),this.createHenge(300, 460, 100, 100),this.createHenge(400, 460, 100, 100),
            this.createHenge(148, 360, 100, 100),this.createSquare(250,360,50),this.createHenge(352, 360, 100, 100),
            this.createHenge(200, 260, 100, 100),this.createHenge(300, 260, 100, 100),
        ]

        let output = []
        for(var i = 0; i < henges.length; i ++){output=output.concat(henges[i])}
        for(var i = 0; i < output.length; i ++){output[i].atRestTimer=100;output[i].action=[0, 0, 0]}
        return output
    },
    ramp:function(w, h){
        let mesh = []
        let x = 0
        mesh.push([-w/2,h/2+5])
        let reso = 10
        // a*w*w = h
        // a = h / (w*w)
        let factor = -(h/(w*w))
        for(var i = 0; i < reso; i ++){
            x+=w/reso
            mesh.push([x-w/2,factor*(x*x)+h/2-5])
        }
        mesh.push([w/2+5,-h/2])
        mesh.push([w/2,h/2])
        return [
            new RigidBody(200, 250, mesh)
        ]
    },
    createCircle:function(x,y,r,reso){
        let mesh = []
        let incr = 6.28 / reso
        for(var i = 0; i < reso; i++){
            mesh.push([r*Math.cos(incr*i), r*Math.sin(incr*i)])
        }
        return new RigidBody(x, y, mesh)
    },
    randomCircles:function(amount){
        let output = []
        for(var i = 0; i < amount; i ++){
            let r = Math.random()*30 + 10
            output.push(this.createCircle(Math.random()*512, Math.random()*512, r, Math.trunc(Math.random()*4+16)))
        }
        return output
    },
    alloy:function(){// deterministic setup since circles are so finnicky w/ subsumption
        let output = []
        for(var i = 0; i < 45; i ++){
            let r = 30
            if(i%10==2){output.push(this.createCircle((13.5*i)%512, (74*i)%512, 20, 10))}else{
            output.push(this.createCircle((13.5*i)%512, (74*i)%512, r, 12+Math.random()))}
        }
        return output
    },
    createAngryBird:function(x,y,r, rot = 3.14){
        const silhouette = [
            [10,0],[8.092041809880323,5.875275257138918],[3.096228130570242,9.5085946050647],
            [-3.081080312779924,9.513513762338286],[-8.082674272693101,5.888155619677953],
            [-9.999987317275394,0.01592652916486828],[-8.101388821239993,-5.862379991700271],
            [-3.1113680946388222,-9.503651328813763],[3.0659246796909887,-9.518408788156858],[14,-2]]
        let scale = r/10
        let mesh = []
        for(var i = 0; i < silhouette.length; i ++){
            mesh.push([silhouette[i][0]*scale, -silhouette[i][1]*scale])
        }
        let rb = new RigidBody(x,y,mesh);rb.rot = rot
        return rb
    }
}