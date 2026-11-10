/**
 * Photographs used on the public instructor site. All are real photographs
 * published under the Unsplash licence, stored at 2560px so they stay sharp
 * on large and high-density screens. The people shown are not instructors,
 * learners or service users of Social Work Consultancy Ltd. `place` is only
 * set where the photographer stated it.
 */
export type Photo = {
  src: string;
  alt: string;
  by: string;
  /** Unsplash photo id, for the credit link. */
  ref: string;
  place?: string;
  width: number;
  height: number;
};

const p = (
  file: string,
  width: number,
  height: number,
  by: string,
  ref: string,
  alt: string,
  place?: string,
): Photo => ({ src: `/images/site/${file}.webp`, width, height, by, ref, alt, place });

export const photos = {
  presenting: p("presenting-whiteboard", 2560, 1705, "UK Black Tech", "CjYnf6YL0NY",
    "A man in a dark suit writes on a whiteboard while two colleagues watch from their seats."),
  lectureMic: p("lecture-mic", 2560, 2048, "Ufoma Ojo", "IdlNlU8PQmU",
    "A woman in a blazer speaks into a microphone at the front of a lecture hall with red seats."),
  listening: p("listening-row", 2560, 2048, "Ufoma Ojo", "MDcaad-_hv0",
    "Three young adults sit in a row, listening closely to a session."),
  coursePlanning: p("course-planning", 2560, 2048, "Ufoma Ojo", "nZ0gXsbChxA",
    "Two women in black T-shirts work through something together on a laptop."),
  recording: p("recording-lesson", 2047, 2560, "Oladimeji Ajegbile", "2IJJAIlxsdg",
    "A man in headphones speaks into a studio microphone in front of a computer screen."),
  writingNotes: p("writing-notes", 1920, 2560, "Iwaria Inc.", "Rbus5PbeBzM",
    "A woman with locs and headphones writes notes in a notebook on her lap."),
  deskConversation: p("desk-conversation", 2560, 1707, "Ninthgrid", "XzHAcQoxngk",
    "A man explains something with open hands to the person across his desk."),
  speakerMic: p("speaker-mic", 1707, 2560, "Lisa Marie Theck", "j6QC0XoxMrE",
    "A woman holds a microphone and speaks from a lectern."),
  pointing: p("pointing-print", 2560, 1707, "West Kenya Union Conference Adventist Media", "VS9ny1IvSoc",
    "A smiling woman in glasses and a patterned dress points to one side with both hands."),
  laptopSmile: p("laptop-smile", 1920, 2560, "Francis Odeyemi", "9ewfCZmObeM",
    "A man grins over his open laptop in a bright workspace."),
  tabletHijab: p("tablet-hijab", 1920, 2560, "Francis Odeyemi", "E9tuaCSbnDg",
    "A woman in a white hijab and glasses sits with a tablet, looking at the camera."),
  library: p("library-glasses", 2560, 1707, "James Sserumaga", "bplo36RvpEQ",
    "A man in glasses sits in front of shelves of colourful books."),
  communityTalk: p("community-talk", 2560, 1707, "Michael Ali", "_TPjI57-uMk",
    "A woman stands and speaks to a group seated on a shaded veranda."),
  ijebuGathering: p("ijebu-gathering", 2560, 1707, "Omotayo Tajudeen", "BsCVygTl5vg",
    "A man in green traditional dress speaks to a line of people in agbada and wrappers on a lawn.", "Ijebu Ode, Ogun"),
  whiteboardLaptop: p("whiteboard-laptop", 2560, 1709, "Adetola Afolabi", "W6Xfv9Rq1j0",
    "A man in glasses and braces sits beside a whiteboard with his laptop open."),
  yellowBlazer: p("yellow-blazer", 2048, 2560, "alex starnes", "PK_t0Lrh7MM",
    "A smiling woman in a yellow blazer holds a tablet, one hand on her hip."),
  practitioner: p("practitioner", 2560, 1707, "Blessing Olarewaju", "78akGVck7EY",
    "A young woman with braided hair stands with her arms folded, smiling, on the walkway of a public building."),
  portraitJoy: p("portrait-joy", 2560, 1707, "Kona Studios", "fUfhxViXi9s",
    "A young woman with natural hair laughs, looking off to one side, outdoors."),
  zariaSerene: p("zaria-serene", 1707, 2560, "Muhammad-Taha Ibrahim", "DWcGIvmI30Y",
    "A young woman in a pink headscarf rests against a tree with her eyes closed, smiling.", "Zaria, Kaduna"),
  teamMeeting: p("team-meeting", 2560, 1707, "Ninthgrid", "d6-bg-lCvZY",
    "Colleagues sit around a meeting table while one of them speaks."),
  // From the learner site's set (2000px originals).
  elderSeated: p("elder-seated", 1257, 2000, "John Onaeko", "FCw0x_0Lh5M",
    "An older man sits on a wall with his hands clasped, a town behind him."),
  openHands: p("open-hands", 2000, 1500, "HisArt Photos", "beoXJAaoAiA",
    "Two open hands held palms up as water runs over them."),
  clayHouse: p("clay-house", 1500, 2000, "Tope A. Asokere", "AjZemCyw_0g",
    "A red earth house with a tin roof stands in a swept yard.", "Abeokuta, Ogun"),
  redRoad: p("red-road", 2000, 1500, "Joshua Oluwagbemiga", "if1IPTI_iYc",
    "A motorcycle travels a wide red-earth road into town under heavy clouds."),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

export const photoCreditUrl = (photo: Photo) => `https://unsplash.com/photos/${photo.ref}`;
