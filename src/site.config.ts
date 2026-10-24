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
    'I am an M.Sc. student in Computer Science at the University of Udine. I work on automata theory and formal languages.',

  dblpPid: '393/1917',

  links: {
    email: 'minisini.alessandro@spes.uniud.it',
    dblp: 'https://dblp.org/pid/393/1917.html',
    orcid: 'https://orcid.org/0009-0001-2485-0507',
    scholar: '',
    github: 'https://github.com/alemini18',
    linkedin: 'https://www.linkedin.com/in/alemini',
  },
};

export const fullName = `${site.name.first} ${site.name.last}`;

/** Contact links in display order, without the empty ones. */
export function contactLinks() {
  const { email, dblp, orcid, scholar, github, linkedin } = site.links;
  return [
    { text: 'email', href: email && `mailto:${email}` },
    { text: 'orcid', href: orcid },
    { text: 'dblp', href: dblp },
    { text: 'scholar', href: scholar },
    { text: 'github', href: github },
    { text: 'linkedin', href: linkedin },
  ].filter((l) => l.href);
}
