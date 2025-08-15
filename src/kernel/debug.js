// Debug utility for generating test data
// Exposes a function to window for easy testing

import { kernel } from './store.js';

const generateRandomData = () => {
  // Real image URLs from Unsplash
  const images = [
    {
      id: 'img_1',
      name: 'Mountain Landscape',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      type: 'image',
      size: 2450000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_2',
      name: 'Ocean Sunset',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      type: 'image',
      size: 3120000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_3',
      name: 'Forest Path',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      type: 'image',
      size: 1890000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_4',
      name: 'City Skyline',
      url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
      type: 'image',
      size: 2780000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_5',
      name: 'Desert Dunes',
      url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop',
      type: 'image',
      size: 2030000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_6',
      name: 'Aurora Borealis',
      url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop',
      type: 'image',
      size: 3560000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_7',
      name: 'Waterfall',
      url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop',
      type: 'image',
      size: 2670000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_8',
      name: 'Wildlife',
      url: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=800&h=600&fit=crop',
      type: 'image',
      size: 2980000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_9',
      name: 'Space Galaxy',
      url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop',
      type: 'image',
      size: 3340000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img_10',
      name: 'Beach Waves',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      type: 'image',
      size: 2890000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Popular websites with real URLs
  const apps = [
    {
      id: 'app_1',
      name: 'Google',
      url: 'https://www.google.com',
      type: 'app',
      icon: 'https://www.google.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_2',
      name: 'GitHub',
      url: 'https://github.com',
      type: 'app',
      icon: 'https://github.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_3',
      name: 'YouTube',
      url: 'https://www.youtube.com',
      type: 'app',
      icon: 'https://www.youtube.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_4',
      name: 'Reddit',
      url: 'https://www.reddit.com',
      type: 'app',
      icon: 'https://www.reddit.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_5',
      name: 'Twitter',
      url: 'https://twitter.com',
      type: 'app',
      icon: 'https://twitter.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_6',
      name: 'LinkedIn',
      url: 'https://www.linkedin.com',
      type: 'app',
      icon: 'https://www.linkedin.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_7',
      name: 'Netflix',
      url: 'https://www.netflix.com',
      type: 'app',
      icon: 'https://www.netflix.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_8',
      name: 'Spotify',
      url: 'https://open.spotify.com',
      type: 'app',
      icon: 'https://open.spotify.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_9',
      name: 'Discord',
      url: 'https://discord.com',
      type: 'app',
      icon: 'https://discord.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app_10',
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      type: 'app',
      icon: 'https://stackoverflow.com/favicon.ico',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Real music tracks (using Wikimedia Commons MP3s)
  const songs = [
    {
      id: 'song_1',
      name: 'The Blue Danube',
      artist: 'Johann Strauss II',
      url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/%22An_der_sch%C3%B6nen%2C_blauen_Donau%22_performed_by_the_U.S._Marine_Band.mp3',
      type: 'song',
      duration: 354,
      size: 8500000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_2',
      name: 'Hungarian Rhapsody No. 6',
      artist: 'Franz Liszt',
      url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/20/Franz_Liszt_-_Second_Hungarian_Rhapsody.ogg/Franz_Liszt_-_Second_Hungarian_Rhapsody.ogg.mp3',
      type: 'song',
      duration: 183,
      size: 4200000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_3',
      name: 'Radetzky March',
      artist: 'Johann Strauss I',
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/USMC_Band_-_Radetzky_March.mp3',
      type: 'song',
      duration: 294,
      size: 6800000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_4',
      name: 'Serenade No. 10 "Gran Partita"',
      artist: 'W.A. Mozart',
      url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Mozart%27s_Serenade_No._10_%22Grand_Partita%22_-_I._Largo._Molto_Allegro_-_United_States_Marine_Band.mp3',
      type: 'song',
      duration: 339,
      size: 7800000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_5',
      name: 'From Holberg\'s Time - Praeludium',
      artist: 'Edvard Grieg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Grieg%27s_Suite_for_Strings%2C_Op._40%2C_%22From_Holberg%E2%80%99s_Time%22_-_I._Praeludium_-_Chamber_Orchestra_-_United_States_Marine_Band.mp3',
      type: 'song',
      duration: 137,
      size: 3200000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_6',
      name: 'From Holberg\'s Time - Gavotte',
      artist: 'Edvard Grieg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Grieg%27s_Suite_for_Strings%2C_Op._40%2C_%22From_Holberg%E2%80%99s_Time%22_-_III._Gavotte-Musette-Gavotte_-_Chamber_Orchestra_-_United_States_Marine_Band.mp3',
      type: 'song',
      duration: 165,
      size: 3800000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_7',
      name: 'Violin Concerto No. 1 in A minor',
      artist: 'J.S. Bach',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Violin_Concerto_No.1_in_A_minor_-_I._Allegro_moderato_-_Chamber_Orchestra_-_United_States_Marine_Band.mp3',
      type: 'song',
      duration: 315,
      size: 7200000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_8',
      name: 'Concertino for Flute in D Major',
      artist: 'Cécile Chaminade',
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Flute_Concertino_in_D_major_-_United_States_Marine_Band.mp3',
      type: 'song',
      duration: 518,
      size: 11800000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_9',
      name: 'March, Op. 99',
      artist: 'Sergei Prokofiev',
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Sergei_Prokofiev%27s_%22March%2C_Opus_99%22_performed_by_the_U.S._Marine_Band_in_1992.mp3',
      type: 'song',
      duration: 266,
      size: 6100000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'song_10',
      name: 'The Stars and Stripes Forever',
      artist: 'John Philip Sousa',
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Sousa%27s_%22The_Stars_and_Stripes_Forever%22_-_United_States_Marine_Band_%282017%29.mp3',
      type: 'song',
      duration: 147,
      size: 3400000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Real video URLs (using sample videos)
  const videos = [
    {
      id: 'video_1',
      name: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video',
      duration: 596,
      size: 186000000,
      resolution: '1080p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_2',
      name: 'Elephant Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      type: 'video',
      duration: 653,
      size: 204000000,
      resolution: '1080p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_3',
      name: 'For Bigger Blazes',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      type: 'video',
      duration: 15,
      size: 5000000,
      resolution: '720p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_4',
      name: 'For Bigger Escape',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscape.mp4',
      type: 'video',
      duration: 15,
      size: 6000000,
      resolution: '720p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_5',
      name: 'For Bigger Fun',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      type: 'video',
      duration: 15,
      size: 4500000,
      resolution: '720p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_6',
      name: 'For Bigger Joyrides',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      type: 'video',
      duration: 15,
      size: 5500000,
      resolution: '720p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_7',
      name: 'For Bigger Meltdowns',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      type: 'video',
      duration: 15,
      size: 4800000,
      resolution: '720p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_8',
      name: 'Sintel',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      type: 'video',
      duration: 888,
      size: 276000000,
      resolution: '1080p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_9',
      name: 'Subaru Outback On Street And Dirt',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      type: 'video',
      duration: 15,
      size: 7000000,
      resolution: '720p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'video_10',
      name: 'Tears of Steel',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      type: 'video',
      duration: 734,
      size: 228000000,
      resolution: '1080p',
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Real document URLs (PDFs and other documents)
  const documents = [
    {
      id: 'doc_1',
      name: 'Sample PDF Document',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'document',
      size: 132000,
      pages: 1,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_2',
      name: 'RFC 793 - TCP Protocol',
      url: 'https://www.rfc-editor.org/rfc/rfc793.txt',
      type: 'document',
      size: 245000,
      pages: 85,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_3',
      name: 'HTML5 Specification',
      url: 'https://www.w3.org/TR/html5/',
      type: 'document',
      size: 890000,
      pages: 1200,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_4',
      name: 'CSS Specification',
      url: 'https://www.w3.org/TR/CSS/',
      type: 'document',
      size: 567000,
      pages: 800,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_5',
      name: 'JavaScript Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      type: 'document',
      size: 123000,
      pages: 45,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_6',
      name: 'Git Documentation',
      url: 'https://git-scm.com/doc',
      type: 'document',
      size: 456000,
      pages: 200,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_7',
      name: 'React Documentation',
      url: 'https://react.dev/',
      type: 'document',
      size: 234000,
      pages: 150,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_8',
      name: 'Vue.js Guide',
      url: 'https://vuejs.org/guide/',
      type: 'document',
      size: 178000,
      pages: 95,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_9',
      name: 'Svelte Tutorial',
      url: 'https://svelte.dev/tutorial',
      type: 'document',
      size: 345000,
      pages: 180,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_10',
      name: 'Node.js Documentation',
      url: 'https://nodejs.org/docs/',
      type: 'document',
      size: 678000,
      pages: 300,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return {
    images,
    apps,
    songs,
    videos,
    documents,
    all: [...images, ...apps, ...songs, ...videos, ...documents]
  };
};

// Function to add test data directly to file system
const addTestDataToFS = () => {
  const data = generateRandomData();
  
  // Create folders for each type
  kernel.addDirectory('Images');
  kernel.addDirectory('Apps');
  kernel.addDirectory('Music');
  kernel.addDirectory('Videos');
  kernel.addDirectory('Documents');
  
  // Add images
  data.images.forEach((image, index) => {
    kernel.addFile(image.name, image.url, 'image');
  });
  
  // Add apps
  data.apps.forEach((app, index) => {
    kernel.addFile(app.name, app.url, 'app');
  });
  
  // Add songs
  data.songs.forEach((song, index) => {
    kernel.addFile(song.name, song.url, 'music');
  });
  
  // Add videos
  data.videos.forEach((video, index) => {
    kernel.addFile(video.name, video.url, 'video');
  });
  
  // Add documents
  data.documents.forEach((doc, index) => {
    kernel.addFile(doc.name, doc.url, 'document');
  });
  
  kernel.sync();
  console.log('Test data added to file system!');
  return data;
};

// Expose the functions to window for easy testing
if (typeof window !== 'undefined') {
  window.generateTestData = generateRandomData;
  window.addTestDataToFS = addTestDataToFS;
  window.debug = {
    generateTestData: generateRandomData,
    addTestDataToFS: addTestDataToFS,
    // Helper function to log the generated data
    logTestData: () => {
      const data = generateRandomData();
      console.log('Generated Test Data:', data);
      return data;
    }
  };
}

export { generateRandomData, addTestDataToFS };
