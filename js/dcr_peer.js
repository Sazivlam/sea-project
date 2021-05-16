import Peer from 'peerjs'

class DCRPeer{
	peer = null; 
    id = null;
    connection = null;

	initializePeer(id)
	{
		if (id === undefined){
			this.peer = new Peer();
			this.id = this.peer.id;
			console.log('No ID passed! Randomly generated peer ID is: ' + this.id);
		}
		else{
			this.peer = new Peer(id);
			this.id = this.peer.id;
			console.log('Peer ID is: ' + this.id);
		}
	}

	connect(id)
	{
		this.connection = this.peer.connect(id);
		console.log('Connection succesful');
	}
}