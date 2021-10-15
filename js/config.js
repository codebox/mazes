const config = {
    mazeSizes: [10,20,30,40],
    algorithms: [
        {name:'Binary Tree', maskable: false, function: 'binaryTree'},
        {name:'Sidewinder', maskable: false, function: 'sidewinder'},
        {name:'Aldous Broder', maskable: true, function: 'aldousBroder'},
        {name:'Wilson\'s', maskable: true, function: 'wilson'},
        {name:'Hunt and Kill', maskable: true, function: 'huntAndKill'},
        {name:'Kruskal\'s', maskable: true, function: 'kruskals'},
        {name:'Recursive Backtrack', maskable: true, function: 'recursiveBacktrack'}
    ]
};