export enum SessionType {
  PeerToPeer = 'Peer To Peer',
  PeerToPeerMultimedia = 'Peer To Peer (Multimedia)',
  Conference = 'Conference',
  Webinar = 'Webinar',
}

export const SessionTypeMap: Record<string, SessionType> = {
  PEER_TO_PEER: SessionType.PeerToPeer,
  PEER_TO_PEER_MULTIMEDIA: SessionType.PeerToPeerMultimedia,
  PEER2PEER: SessionType.PeerToPeer,
  PEER2PEER_MULTIMEDIA: SessionType.PeerToPeerMultimedia,
  CONFERENCE: SessionType.Conference,
  WEBINAR: SessionType.Webinar,
};
