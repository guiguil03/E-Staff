import { DailyService } from "./daily.service";

describe("DailyService — enregistrement cloud", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.DAILY_API_KEY = "test-key";
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: "seance-1", url: "https://x.daily.co/seance-1", token: "tok" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.DAILY_API_KEY;
    delete process.env.DAILY_RECORDING_ENABLED;
  });

  function body(callIndex = 0) {
    return JSON.parse(fetchMock.mock.calls[callIndex][1].body);
  }

  it("n'active pas l'enregistrement sans DAILY_RECORDING_ENABLED", async () => {
    await new DailyService().createRoom("seance-1", 123);
    expect(body().properties.enable_recording).toBeUndefined();
  });

  it("active l'enregistrement cloud sur les salles de classe virtuelle quand l'option est activée", async () => {
    process.env.DAILY_RECORDING_ENABLED = "true";
    await new DailyService().createRoom("seance-1", 123);
    expect(body().properties.enable_recording).toBe("cloud");
  });

  it("n'enregistre jamais les Lives du Forum (salles broadcastOnly)", async () => {
    process.env.DAILY_RECORDING_ENABLED = "true";
    await new DailyService().createRoom("live-1", 123, true);
    expect(body().properties.enable_recording).toBeUndefined();
  });

  it("le jeton du formateur démarre l'enregistrement quand demandé", async () => {
    await new DailyService().mintMeetingToken({
      roomName: "seance-1",
      userId: "f-1",
      userName: "Ravaka",
      isOwner: true,
      startRecording: true,
    });
    expect(body().properties).toEqual(
      expect.objectContaining({ enable_recording: "cloud", start_cloud_recording: true })
    );
  });

  it("renvoie le lien d'accès temporaire d'un enregistrement", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ download_link: "https://daily/rec.mp4", expires: 1700000000 }),
    });
    const lien = await new DailyService().getRecordingAccessLink("rec-1");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.daily.co/v1/recordings/rec-1/access-link");
    expect(lien).toEqual({ url: "https://daily/rec.mp4", expires: 1700000000 });
  });
});
