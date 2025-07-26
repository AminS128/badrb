const RBsamples = {// sample rb-lists that can be passed to the constructor of a RigidSystem
    one:[RigidSystem.createSquare(220, 320, 40),RigidSystem.createSquare(200, 50, 40),
        RigidSystem.createSquare(160, 405, 40),
        new RigidBody(90, 400, [[0, -50], [-40, 40], [80, 80], [50,-10],[10,30]]),
        new RigidBody(350, 100, [[0, -30], [-40, 10], [80, 30]]),
        new RigidBody(310, 400, [[0, -20], [-50, 40], [60, 80]])
    ],
    tower:[
        RigidSystem.createSquare(200, 20, 15),
        RigidSystem.createSquare(200, 70, 20),
        RigidSystem.createSquare(200, 170, 25),
        RigidSystem.createSquare(200, 270, 30),
        RigidSystem.createSquare(200, 370, 40),
        RigidSystem.createSquare(200, 470, 50),],
    randomSquares:[RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10),
        RigidSystem.createSquare(Math.random()*512, Math.random()*512, Math.random()*60+10)],
    
}