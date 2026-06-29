export enum SessionScenario {
  Internal = 'Internal',
  External = 'External',
  Federated = 'Federated',
}

export const SessionScenarioMap: Record<string, SessionScenario> = {
  INTERNAL: SessionScenario.Internal,
  EXTERNAL: SessionScenario.External,
  FEDERATED: SessionScenario.Federated,
};
