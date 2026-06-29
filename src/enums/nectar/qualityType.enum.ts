export enum QualityType {
  PeerToPeer = 'Peer To Peer',
  Pstn = 'PSTN/External',
  Conference = 'Conference',
  Webinar = 'Webinar',
}

export const QualityTypeLabels: Record<string, QualityType> = {
  PEER2PEER: QualityType.PeerToPeer,
  PSTN: QualityType.Pstn,
  CONFERENCE: QualityType.Conference,
  WEBINAR: QualityType.Webinar,
};
