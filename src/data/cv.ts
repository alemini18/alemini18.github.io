// Contents of the CV page (/cv). Text fields may contain inline HTML (links, <em>, <strong>).
// The PDF version is public/cv.pdf.

export interface CvEntry {
  title: string;
  url?: string;
  org: string;
  place?: string;
  when: string;
  text?: string;
  bullets?: string[];
}

export interface Honor {
  year: number;
  result: string;
  event: string;
  place: string;
}

export const cv = {
  headline: 'M.Sc. student in Computer Science',
  pdf: '/cv.pdf',

  education: [
    {
      title: 'Scuola Superiore Universitaria di Toppo Wassermann',
      org: 'Second-level master’s degree',
      place: 'Udine, Italy',
      when: 'Sep 2021 – now',
      bullets: [
        'GPA: 30/30.',
        'The School for Advanced Studies of the University of Udine is a higher learning institution based on merit (10% admission rate).',
        'Relevant courses: Algorithms for massive data, Lambda calculus, Constraint programming, Graph isomorphism theory.',
      ],
    },
    {
      title: 'University of Udine',
      org: 'M.Sc. in Computer Science',
      place: 'Udine, Italy',
      when: 'Oct 2024 – now',
      bullets: [
        'GPA: 30/30.',
        'Relevant courses: Computability theory, Complexity theory, Automated reasoning, Formal verification, Distributed systems and algorithms, Operations research.',
      ],
    },
    {
      title: 'University of Udine',
      org: 'B.Sc. in Computer Science',
      place: 'Udine, Italy',
      when: 'Sep 2021 – Oct 2024',
      bullets: [
        'GPA: 29.3/30. Graduated with 110/110 cum laude.',
        'Research thesis: <a href="https://github.com/alemini18/bachelor_cs_thesis/blob/main/Thud.pdf"><em>Co-lexicographically Ordering Automata: the Hasse Automaton</em></a> (supervisor: prof. Alberto Policriti).',
      ],
    },
  ] satisfies CvEntry[],

  projects: [
    {
      title: 'AI Safety Research Fellowship',
      url: 'https://www.apartresearch.com/',
      org: 'Apart Research',
      place: 'Remote',
      when: 'May 2024 – Dec 2024',
      text: 'My team focused on integrating formal methods with large language models. We designed an MVP for a new cybersecurity benchmark and developed a provably correct sandbox for evaluating attacks on security protocols. Our research work, <a href="https://arxiv.org/abs/2411.13627"><em>CryptoFormalEval</em></a>, was presented at the System-2 Reasoning Workshop at <strong>NeurIPS 2024</strong>.',
    },
    {
      title: 'Predecessor function in lambda calculus',
      url: 'https://github.com/alemini18/predecessor/blob/main/Predecessor.pdf',
      org: 'Short thesis for the Scuola Superiore (supervisor: prof. Fabio Alessi)',
      place: 'Udine, Italy',
      when: 'Jul 2023 – Oct 2023',
      text: 'A survey of the solutions to the predecessor problem in lambda calculus, describing various perspectives on the problem and comparing them through a simple metric on the normal forms of lambda terms.',
    },
    {
      title: 'Longest common prefix sketch and application to the Lempel–Ziv compression algorithm',
      url: 'https://github.com/alemini18/lcp/blob/main/lcp.pdf',
      org: 'Research project at the Scuola Superiore (supervisor: prof. Nicola Prezza)',
      place: 'Udine, Italy',
      when: 'Jul 2022 – Oct 2022',
      text: 'Originating from the <em>Algorithms for Massive Data</em> course, the project looked for a space-efficient representation of strings that approximates the longest common prefix between them. The result is a sketch that, with high probability, computes this measure approximately. It was implemented and tested on real datasets as a support structure for the Lempel–Ziv 77 compression algorithm.',
    },
  ] satisfies CvEntry[],

  honors: {
    international: [
      { year: 2024, result: 'Contestant, 22nd place', event: 'ICPC Southwestern Europe Regional Contest', place: 'Paris, France' },
      { year: 2023, result: 'Contestant', event: 'ICPC Southwestern Europe Regional Contest', place: 'Milan, Italy' },
      { year: 2020, result: 'Contestant', event: 'Central European Olympiad in Informatics', place: 'Online' },
      { year: 2020, result: 'Contestant', event: 'Romanian Masters in Informatics', place: 'Online' },
    ] satisfies Honor[],
    national: [
      { year: 2021, result: 'Silver medal', event: 'Italian Mathematical Olympiad', place: 'Cesenatico, Italy' },
      { year: 2021, result: '6th place', event: 'Italian Olympiad in Informatics, team competition', place: 'Bologna, Italy' },
      { year: 2020, result: 'Silver medal', event: 'Italian Olympiad in Informatics', place: 'Remote' },
      { year: 2019, result: 'Silver medal', event: 'Italian Olympiad in Informatics', place: 'Matera, Italy' },
    ] satisfies Honor[],
  },

  activities: [
    {
      title: 'Quantum Code Challenge',
      url: 'https://www.cagliaridlab.it/it/event.page?contentId=EVT881',
      org: 'CRS4, DLAB',
      place: 'Remote',
      when: 'Oct 22–25, 2024',
      text: 'A hackathon hosted on the qBraid platform, with algorithmic challenges on quantum computing, quadratic optimization and quantum machine learning. My team <strong>ranked first</strong> among 15 participating teams.',
    },
    {
      title: 'Competitive programming trainer',
      org: 'University of Udine',
      place: 'Udine, Italy',
      when: '2022 – now',
      text: 'I teach competitive programming classes for university students, providing exercises and materials, and organized a training contest used to select the <strong>SWERC</strong> teams.',
    },
    {
      title: 'cp-algorithms contributor',
      url: 'https://cp-algorithms.com',
      org: 'cp-algorithms.com',
      when: '',
      text: 'I contributed to cp-algorithms.com, a comprehensive resource for competitive programmers, with an article on the <a href="https://cp-algorithms.com/graph/hungarian-algorithm.html">Hungarian algorithm</a>. I plan to write more articles on the data structures I am studying.',
    },
    {
      title: 'First Ascent by Bending Spoons',
      org: 'Selected student',
      place: 'Lisbon, Portugal',
      when: 'Apr 2024',
      text: 'One of the 20 Italian students selected for a four-day retreat in Lisbon to meet industry experts from Bending Spoons and attend talks on software engineering.',
    },
    {
      title: 'International Olympiad in Informatics training program',
      org: 'Selected student',
      place: 'Volterra, Italy',
      when: '2019 – 2020',
      bullets: [
        'Selected for the Italian training program for the International Olympiad in Informatics.',
        'Attended competitive programming lessons, mainly on algorithms and data structures, and took part in the selection competitions for the Italian team.',
        'Qualified for the <a href="http://ceoi2020.inf.elte.hu/">CEOI</a> (Central European Olympiad in Informatics) and the RMI (Romanian Masters in Informatics) 2020.',
      ],
    },
  ] satisfies CvEntry[],
};
