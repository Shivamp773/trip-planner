export const MAX_TRIP_DAYS = 14;

export const SelectTravelList = [
  {
    id: 1,
    title: 'Just me',
    desc: 'Lone wolf',
    icon: '🛩️',
    people: '1',
  },
  {
    id: 2,
    title: 'A couple',
    desc: 'Two travellers in tandem',
    icon: '🥂',
    people: '2',
  },
  {
    id: 3,
    title: 'Family/Friends',
    desc: 'A group of fun loving adventurers',
    icon: '🏘️',
    people: '3 to 10 or more',
  },
];

export const SelectBudgetOptions = [
  {
    id: 1,
    title: 'Low',
    desc: 'Stay conscious of costs',
    icon: '💵',
  },
  {
    id: 2,
    title: 'Moderate',
    desc: 'Explore more, spend wisely',
    icon: '💸',
  },
  {
    id: 3,
    title: 'Luxury',
    desc: 'Elevate your journey with unforgettable experiences',
    icon: '🤑',
  },
];

/** Progress messages shown (in order) while the trip is being generated. */
export const LOADING_MESSAGES = [
  'Getting trip details…',
  'Getting hotel recommendations…',
  'Creating trip plan…',
  'Generating trip details…',
];
