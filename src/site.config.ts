// The single place for personal data and links.
// Any link left as an empty string is not shown on the site.

export const site = {
  // Public URL of the site. With a custom domain, put it here
  // (e.g. 'https://www.example.org'): the CNAME file is generated from it.
  url: 'https://alemini18.github.io',

  name: { first: 'Alessandro', last: 'Minisini' },
  description: 'Personal academic page of Alessandro Minisini.',

  // Two lines of presentation, shown in the About section.
  about:
    'I work on automata theory and formal languages, and on the use of formal methods to verify software and protocols.',

  dblpPid: '393/1917',

  links: {
    email: '',
    dblp: 'https://dblp.org/pid/393/1917.html',
    orcid: '',
    scholar: '',
    github: 'https://github.com/alemini18',
  },
};

export const fullName = `${site.name.first} ${site.name.last}`;
