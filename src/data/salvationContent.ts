import type {
  LanguageCode,
  PresentationFormat,
  PresentationProject,
  ProjectLanguageMode,
  Slide,
  SlideLayoutId,
  ThemeId,
} from '../types/presentation';
import { getThemeById, STUDIO_BACKDROPS } from './themes';

interface SlideBlueprint {
  order: number;
  isPrayerSlide?: boolean;
  defaultLayout: SlideLayoutId;
  backdropIndex: number;
  content: Slide['content'];
}

const SALVATION_BLUEPRINTS: SlideBlueprint[] = [
  {
    order: 1,
    defaultLayout: 'cinematic-left',
    backdropIndex: 0,
    content: {
      ta: {
        kicker: 'பகுதி 01 · இரட்சிப்பின் வழி',
        title: 'ஆதி மனிதன்',
        subtitle: 'தேவனுடைய சாயலும், ஆசீர்வாதமும், ஐக்கியமும்',
        points: [
          { id: 's1-ta-1', label: 'தேவனுடைய சாயல்', reference: 'ஆதியாகமம் 1:27' },
          { id: 's1-ta-2', label: 'ஆசீர்வாதம்', reference: 'ஆதியாகமம் 1:28' },
          { id: 's1-ta-3', label: 'ஐக்கியமும் சந்தோஷமும்', reference: '' },
          { id: 's1-ta-4', label: 'உடன்படிக்கை', reference: 'ஆதியாகமம் 2:17' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 01 · The Way of Salvation',
        title: 'ORIGINAL MAN',
        subtitle: 'Created in God’s Image for Eternal Fellowship',
        points: [
          { id: 's1-en-1', label: "God's Image", reference: 'Genesis 1:27' },
          { id: 's1-en-2', label: 'Blessing', reference: 'Genesis 1:28' },
          { id: 's1-en-3', label: 'Fellowship and Happiness', reference: '' },
          { id: 's1-en-4', label: 'Covenant', reference: 'Genesis 2:17' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '01 කොටස · ගැළවීමේ මාර්ගය',
        title: 'මුල් මනුෂ්‍යයා',
        subtitle: 'දෙවියන් වහන්සේගේ ස්වරූපය, ආශිර්වාදය සහ සහභාගිකම',
        points: [
          { id: 's1-si-1', label: 'දෙවියන් වහන්සේගේ ස්වරූපය', reference: 'උත්පත්ති 1:27' },
          { id: 's1-si-2', label: 'ආශිර්වාදය', reference: 'උත්පත්ති 1:28' },
          { id: 's1-si-3', label: 'සහභාගිකම සහ ප්‍රීතිය', reference: '' },
          { id: 's1-si-4', label: 'ගිවිසුම', reference: 'උත්පත්ති 2:17' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 2,
    defaultLayout: 'cinematic-left',
    backdropIndex: 1,
    content: {
      ta: {
        kicker: 'பகுதி 02 · மனிதனின் வீழ்ச்சி',
        title: 'அடிப்படைப் பிரச்சினைகள்',
        subtitle: 'மனிதகுலத்தின் மூன்று ஆவிக்குரிய வேர் பிரச்சினைகள்',
        points: [
          { id: 's2-ta-1', label: 'சாத்தான்', reference: 'ஆதியாகமம் 3:1-5' },
          { id: 's2-ta-2', label: 'பாவம்', reference: 'ஆதியாகமம் 3:6' },
          { id: 's2-ta-3', label: 'தேவனை விட்டுப் பிரிதல்', reference: 'ஆதியாகமம் 3:7-10' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 02 · The Fall of Humanity',
        title: 'FUNDAMENTAL PROBLEMS',
        subtitle: 'The Three Root Causes of Spiritual Separation',
        points: [
          { id: 's2-en-1', label: 'Satan', reference: 'Genesis 3:1-5' },
          { id: 's2-en-2', label: 'Sin', reference: 'Genesis 3:6' },
          { id: 's2-en-3', label: 'Separation from God', reference: 'Genesis 3:7-10' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '02 කොටස · මනුෂ්‍යයාගේ වැටීම',
        title: 'මූලික ගැටළු',
        subtitle: 'ආත්මික වෙන්වීමට හේතු වූ මූලික කාරණා තුන',
        points: [
          { id: 's2-si-1', label: 'සාතන්', reference: 'උත්පත්ති 3:1-5' },
          { id: 's2-si-2', label: 'පාපය', reference: 'උත්පත්ති 3:6' },
          { id: 's2-si-3', label: 'දෙවියන් වහන්සේගෙන් වෙන්වීම', reference: 'උත්පත්ති 3:7-10' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 3,
    defaultLayout: 'two-column-scripture',
    backdropIndex: 2,
    content: {
      ta: {
        kicker: 'பகுதி 03 · தேவனற்ற வாழ்க்கை',
        title: 'அவிசுவாசியின் நிலைமை',
        subtitle: 'தேவனை விட்டுப் பிரிந்த மனிதனின் ஆறு நிலைமைகள்',
        points: [
          { id: 's3-ta-1', label: 'ஆவிக்குரிய பிரச்சினை', reference: '' },
          { id: 's3-ta-2', label: 'விக்கிரக ஆராதனைப் பிரச்சினை', reference: '' },
          { id: 's3-ta-3', label: 'மனப் பிரச்சினை', reference: '' },
          { id: 's3-ta-4', label: 'சரீரப் பிரச்சினை', reference: '' },
          { id: 's3-ta-5', label: 'மரணத்திற்குப் பின் உள்ள பிரச்சினை', reference: '' },
          { id: 's3-ta-6', label: 'சந்ததிப் பிரச்சினை', reference: '' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 03 · Life Apart from God',
        title: 'STATE OF NON-BELIEVER',
        subtitle: 'The Sixfold Consequence of Spiritual Separation',
        points: [
          { id: 's3-en-1', label: 'Spiritual Problem', reference: '' },
          { id: 's3-en-2', label: 'Idol Worship Problem', reference: '' },
          { id: 's3-en-3', label: 'Mental Problem', reference: '' },
          { id: 's3-en-4', label: 'Physical Problem', reference: '' },
          { id: 's3-en-5', label: 'Afterlife Problem', reference: '' },
          { id: 's3-en-6', label: 'Descendant Problem', reference: '' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '03 කොටස · දෙවියන් වහන්සේ නොමැති ජීවිතය',
        title: 'නොඇදහිලිවන්තයාගේ තත්ත්වය',
        subtitle: 'දෙවියන් වහන්සේගෙන් වෙන්වීමේ සයවැදෑරුම් ප්‍රතිඵල',
        points: [
          { id: 's3-si-1', label: 'ආත්මික ගැටළුව', reference: '' },
          { id: 's3-si-2', label: 'රූප නමස්කාර ගැටළුව', reference: '' },
          { id: 's3-si-3', label: 'මානසික ගැටළුව', reference: '' },
          { id: 's3-si-4', label: 'ශාරීරික ගැටළුව', reference: '' },
          { id: 's3-si-5', label: 'මරණින් මතු ජීවිතයේ ගැටළුව', reference: '' },
          { id: 's3-si-6', label: 'පරම්පරාගත ගැටළුව', reference: '' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 4,
    defaultLayout: 'cinematic-left',
    backdropIndex: 3,
    content: {
      ta: {
        kicker: 'பகுதி 04 · தேவனிடம் செல்ல இயலாத வழிகள்',
        title: 'மனிதனின் முயற்சிகள் — தீர்வு அல்ல',
        subtitle: 'மனிதனால் பாவத்தின் பிளவைத் தாண்ட முடியாது',
        points: [
          { id: 's4-ta-1', label: 'மதம்', reference: 'அப்போஸ்தலர் 4:12' },
          { id: 's4-ta-2', label: 'நற்கிரியைகள்', reference: 'ஏசாயா 64:6' },
          { id: 's4-ta-3', label: 'தத்துவம்', reference: 'கொலோசெயர் 2:8' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 04 · The Unbridgeable Chasm',
        title: 'HUMAN EFFORTS – NOT THE SOLUTION',
        subtitle: 'Why Human Works Cannot Cross the Divide to God',
        points: [
          { id: 's4-en-1', label: 'Religion', reference: 'Acts 4:12' },
          { id: 's4-en-2', label: 'Good Deeds', reference: 'Isaiah 64:6' },
          { id: 's4-en-3', label: 'Philosophy', reference: 'Colossians 2:8' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '04 කොටස · මනුෂ්‍යයාට තරණය කළ නොහැකි පරතරය',
        title: 'මිනිස් උත්සාහයන් — විසඳුමක් නොවේ',
        subtitle: 'මිනිස් ක්‍රියාවලින් දෙවියන් වහන්සේ වෙත ළඟා විය නොහැක',
        points: [
          { id: 's4-si-1', label: 'ආගම', reference: 'ක්‍රියා 4:12' },
          { id: 's4-si-2', label: 'යහපත් ක්‍රියා', reference: 'යෙසායා 64:6' },
          { id: 's4-si-3', label: 'දර්ශනය', reference: 'කොලොස්සි 2:8' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 5,
    defaultLayout: 'two-column-scripture',
    backdropIndex: 4,
    content: {
      ta: {
        kicker: 'பகுதி 05 · இயேசு கிறிஸ்துவின் சுவிசேஷம்',
        title: 'தேவனுடைய வழி',
        subtitle: 'தேவன் நமக்காக அனுப்பிய ஒரே இரட்சகர் இயேசு கிறிஸ்து',
        points: [
          { id: 's5-ta-1', label: 'இரட்சகர்', reference: 'யோவான் 3:16' },
          { id: 's5-ta-2', label: 'இயேசு', reference: 'மத்தேயு 1:21' },
          { id: 's5-ta-3', label: 'சிலுவை', reference: 'யோவான் 19:30' },
          { id: 's5-ta-4', label: 'உயிர்த்தெழுதல்', reference: '1 கொரிந்தியர் 15:3-4' },
          { id: 's5-ta-5', label: 'கிறிஸ்து', reference: 'மத்தேயு 16:16' },
          { id: 's5-ta-6', label: 'பரமேறுதல்', reference: 'அப்போஸ்தலர் 1:9-10' },
          { id: 's5-ta-7', label: 'இரண்டாம் வருகை', reference: 'வெளிப்படுத்தின விசேஷம் 22:20' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 05 · The Gospel Bridge',
        title: "GOD'S METHOD",
        subtitle: 'Jesus Christ: God’s Redemptive Plan for All Humanity',
        points: [
          { id: 's5-en-1', label: 'Savior', reference: 'John 3:16' },
          { id: 's5-en-2', label: 'Jesus', reference: 'Matthew 1:21' },
          { id: 's5-en-3', label: 'Cross', reference: 'John 19:30' },
          { id: 's5-en-4', label: 'Resurrection', reference: '1 Corinthians 15:3-4' },
          { id: 's5-en-5', label: 'Christ', reference: 'Matthew 16:16' },
          { id: 's5-en-6', label: 'Ascension', reference: 'Acts 1:9-10' },
          { id: 's5-en-7', label: 'Second Coming', reference: 'Revelation 22:20' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '05 කොටස · ශුභාරංචියේ පාලම',
        title: 'දෙවියන් වහන්සේගේ ක්‍රමය',
        subtitle: 'දෙවියන් වහන්සේ එවූ එකම ගැළවුම්කාරයාණන් වන යේසුස් ක්‍රිස්තුස් වහන්සේ',
        points: [
          { id: 's5-si-1', label: 'ගැළවුම්කාරයාණෝ', reference: 'යොහන් 3:16' },
          { id: 's5-si-2', label: 'යේසුස් වහන්සේ', reference: 'මතෙව් 1:21' },
          { id: 's5-si-3', label: 'කුරුසිය', reference: 'යොහන් 19:30' },
          { id: 's5-si-4', label: 'උත්ථානය', reference: '1 කොරින්ති 15:3-4' },
          { id: 's5-si-5', label: 'ක්‍රිස්තුස් වහන්සේ', reference: 'මතෙව් 16:16' },
          { id: 's5-si-6', label: 'ස්වර්ගාරෝහණය', reference: 'ක්‍රියා 1:9-10' },
          { id: 's5-si-7', label: 'දෙවන පැමිණීම', reference: 'එළිදරව් 22:20' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 6,
    defaultLayout: 'cinematic-left',
    backdropIndex: 5,
    content: {
      ta: {
        kicker: 'பகுதி 06 · அபிஷேகம் பண்ணப்பட்டவர்',
        title: 'கிறிஸ்துவின் 3 பதவிகள்',
        subtitle: 'ராஜா, ஆசாரியர், தீர்க்கதரிசியாக நிறைவேற்றிய பணி',
        points: [
          { id: 's6-ta-1', label: 'மெய்யான ராஜா', reference: 'எபிரெயர் 2:14-15' },
          { id: 's6-ta-2', label: 'மெய்யான ஆசாரியர்', reference: 'எபிரெயர் 9:11-12' },
          { id: 's6-ta-3', label: 'மெய்யான தீர்க்கதரிசி', reference: 'எபிரெயர் 10:19-20' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 06 · The Anointed Office',
        title: 'THREE ROLES OF CHRIST',
        subtitle: 'The Fulfilled Offices of King, Priest, and Prophet',
        points: [
          { id: 's6-en-1', label: 'True King', reference: 'Hebrews 2:14-15' },
          { id: 's6-en-2', label: 'True Priest', reference: 'Hebrews 9:11-12' },
          { id: 's6-en-3', label: 'True Prophet', reference: 'Hebrews 10:19-20' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '06 කොටස · අභිෂේක ලත් තනතුරු',
        title: 'ක්‍රිස්තුස් වහන්සේගේ භූමිකාවන් 3',
        subtitle: 'සැබෑ රජතුමා, පූජකතුමා සහ අනාගතවක්තෘවරයා ලෙස ඉටු කළ මෙහෙවර',
        points: [
          { id: 's6-si-1', label: 'සැබෑ රජතුමා', reference: 'හෙබ්‍රෙව් 2:14-15' },
          { id: 's6-si-2', label: 'සැබෑ පූජකතුමා', reference: 'හෙබ්‍රෙව් 9:11-12' },
          { id: 's6-si-3', label: 'සැබෑ අනාගතවක්තෘවරයා', reference: 'හෙබ්‍රෙව් 10:19-20' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 7,
    defaultLayout: 'cinematic-left',
    backdropIndex: 6,
    content: {
      ta: {
        kicker: 'பகுதி 07 · முழுமையான விடுதலை',
        title: 'எல்லாப் பிரச்சினைகளுக்கும் தீர்வு',
        subtitle: 'கிறிஸ்துவுக்குள் கிடைக்கும் வெற்றி, விடுதலை, மற்றும் வழி',
        points: [
          { id: 's7-ta-1', label: 'சாத்தானின் மேல் வெற்றி', reference: '1 யோவான் 3:8' },
          { id: 's7-ta-2', label: 'பாவத்திலிருந்து விடுதலை', reference: 'ரோமர் 8:2' },
          { id: 's7-ta-3', label: 'வழியான இயேசு', reference: 'யோவான் 14:6' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 07 · Complete Deliverance',
        title: 'SOLUTION TO ALL PROBLEMS',
        subtitle: 'Victory, Freedom, and Restoration Through Christ Alone',
        points: [
          { id: 's7-en-1', label: 'Victory over Satan', reference: '1 John 3:8' },
          { id: 's7-en-2', label: 'Freedom from Sin', reference: 'Romans 8:2' },
          { id: 's7-en-3', label: 'Jesus the Way', reference: 'John 14:6' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '07 කොටස · සම්පූර්ණ නිදහස',
        title: 'සියලු ගැටළු වලට විසඳුම',
        subtitle: 'ක්‍රිස්තුස් වහන්සේ තුළින් ලැබෙන ජයග්‍රහණය, නිදහස සහ මාර්ගය',
        points: [
          { id: 's7-si-1', label: 'සාතන් පරාජය කිරීම', reference: '1 යොහන් 3:8' },
          { id: 's7-si-2', label: 'පාපයෙන් නිදහස', reference: 'රෝම 8:2' },
          { id: 's7-si-3', label: 'මාර්ගය වූ යේසුස් වහන්සේ', reference: 'යොහන් 14:6' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 8,
    defaultLayout: 'cinematic-left',
    backdropIndex: 7,
    content: {
      ta: {
        kicker: 'பகுதி 08 · விசுவாசத்தின் பதில்',
        title: 'இரட்சிப்பைப் பெறுவது எப்படி?',
        subtitle: 'உங்கள் இருதயத்தின் வாசலை இயேசுவுக்குத் திறந்து கொடுங்கள்',
        points: [
          { id: 's8-ta-1', label: 'கிறிஸ்துவை ஏற்றுக்கொள்ளுதல்', reference: 'யோவான் 1:12' },
          { id: 's8-ta-2', label: 'விசுவாசித்து அறிக்கையிடுதல்', reference: 'ரோமர் 10:9-10' },
          { id: 's8-ta-3', label: 'இருதயத்தின் வாசல்', reference: 'வெளிப்படுத்தின விசேஷம் 3:20' },
          { id: 's8-ta-4', label: 'இப்பொழுதே இரட்சிப்பைப் பெறுதல்', reference: 'நீதிமொழிகள் 27:1' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 08 · The Invitation of Grace',
        title: 'HOW TO RECEIVE SALVATION',
        subtitle: 'Open the Door of Your Heart in Faith Today',
        points: [
          { id: 's8-en-1', label: 'Accept Christ', reference: 'John 1:12' },
          { id: 's8-en-2', label: 'Believe and Confess', reference: 'Romans 10:9-10' },
          { id: 's8-en-3', label: 'Door of the Heart', reference: 'Revelation 3:20' },
          { id: 's8-en-4', label: 'Receive Salvation Now', reference: 'Proverbs 27:1' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '08 කොටස · කරුණාවේ ආරාධනය',
        title: 'ගැළවීම ලබා ගන්නේ කෙසේද?',
        subtitle: 'අදම ඇදහිල්ලෙන් ඔබේ හදවතේ දොරටුව විවෘත කරන්න',
        points: [
          { id: 's8-si-1', label: 'ක්‍රිස්තුස් වහන්සේ පිළිගැනීම', reference: 'යොහන් 1:12' },
          { id: 's8-si-2', label: 'විශ්වාස කර ප්‍රකාශ කිරීම', reference: 'රෝම 10:9-10' },
          { id: 's8-si-3', label: 'හදවතේ දොරටුව', reference: 'එළිදරව් 3:20' },
          { id: 's8-si-4', label: 'දැන්ම ගැළවීම ලබා ගැනීම', reference: 'හිතෝපදේශ 27:1' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
  {
    order: 9,
    isPrayerSlide: true,
    defaultLayout: 'prayer-sanctuary',
    backdropIndex: 8,
    content: {
      ta: {
        kicker: 'பகுதி 09 · இருதயத்திலிருந்து ஜெபம்',
        title: 'ஏற்றுக்கொள்ளும் ஜெபம்',
        subtitle: 'விசுவாசத்துடன் சேர்ந்து ஜெபிப்போம்',
        points: [],
        prayerText:
          'அன்புள்ள பரலோகப் பிதாவே, நான் ஒரு பாவி என்பதை ஒப்புக்கொள்கிறேன். என் பாவங்களுக்காக இயேசு கிறிஸ்து சிலுவையில் மரித்து, மூன்றாம் நாளில் உயிர்த்தெழுந்தார் என்பதை நான் முழு இருதயத்தோடு விசுவாசிக்கிறேன்.\n\nஆண்டவராகிய இயேசுவே, இப்பொழுதே என் இருதயத்தின் வாசலைத் திறக்கிறேன். என் வாழ்க்கைக்குள் வாரும்; என் பாவங்களை மன்னித்து, என் இரட்சகராகவும் ஆண்டவராகவும் என்னை வழிநடத்தும்.\n\nஉம்முடைய பிள்ளையாக என்னை ஏற்றுக்கொண்டதற்காக நன்றி. இயேசு கிறிஸ்துவின் நாமத்தில் ஜெபிக்கிறேன். ஆமென்.',
        footerLabel: 'இரட்சிப்பின் வழி',
        needsTranslationReview: true,
        reviewNote:
          'Review or paste your church’s exact printed Tamil Acceptance Prayer wording if you follow a specific ministry booklet.',
      },
      en: {
        kicker: 'Part 09 · Prayer of Faith',
        title: 'ACCEPTANCE PRAYER',
        subtitle: 'Pray Sincerely from Your Heart',
        points: [],
        prayerText:
          'Loving Heavenly Father, I confess that I am a sinner and that I have been separated from You. I believe with all my heart that Jesus Christ died on the cross for my sins and rose again to defeat Satan, sin, and death.\n\nLord Jesus, I open the door of my heart right now. Please come into my life, forgive all my sins, and be my Savior and my Lord forever.\n\nThank You for making me a child of God and guiding my life by Your Holy Spirit. In the name of Jesus Christ I pray. Amen.',
        footerLabel: 'The Way of Salvation',
        needsTranslationReview: true,
        reviewNote:
          'Review or customize the English prayer wording to match your church’s preferred liturgical phrasing.',
      },
      si: {
        kicker: '09 කොටස · ඇදහිල්ලේ යාච්ඤාව',
        title: 'පිළිගැනීමේ යාච්ඤාව',
        subtitle: 'අවංක හදවතින් එක්ව යාච්ඤා කරමු',
        points: [],
        prayerText:
          'ප්‍රේමණීය ස්වර්ගීය පියාණෙනි, මම පව්කාරයෙකු බවත් ඔබ වහන්සේගෙන් වෙන්ව සිටි බවත් පිළිගනිමි. මාගේ පව් උදෙසා යේසුස් ක්‍රිස්තුස් වහන්සේ කුරුසියේ මියගොස්, තුන්වන දින උත්ථාන වූ බව මුළු හදවතින් විශ්වාස කරමි.\n\nස්වාමී වූ යේසුස් වහන්ස, මේ මොහොතේම මාගේ හදවතේ දොරටුව ඔබ වහන්සේට විවෘත කරමි. මාගේ ජීවිතයට වැඩම කර, මාගේ පව් කමා කර, මාගේ ගැළවුම්කාරයාණන් සහ ස්වාමීන් ලෙස මා මඟපෙන්වුව මැනව.\n\nඔබ වහන්සේගේ දරුවෙකු ලෙස මා පිළිගත්තාට ස්තුතියි. යේසුස් ක්‍රිස්තුස් වහන්සේගේ නාමයෙන් යාච්ඤා කරමි. ආමෙන්.',
        footerLabel: 'ගැළවීමේ මාර්ගය',
        needsTranslationReview: true,
        reviewNote:
          'Review or paste your church’s exact printed Sinhala Acceptance Prayer wording if you follow a specific ministry booklet.',
      },
    },
  },
  {
    order: 10,
    defaultLayout: 'two-column-scripture',
    backdropIndex: 9,
    content: {
      ta: {
        kicker: 'பகுதி 10 · புதிய சிருஷ்டியின் வாழ்வு',
        title: 'தேவனுடைய பிள்ளையின் ஆசீர்வாதங்கள்',
        subtitle: 'இரட்சிக்கப்பட்ட தேவனுடைய பிள்ளைக்குரிய ஏழு ஆசீர்வாதங்கள்',
        points: [
          { id: 's10-ta-1', label: 'உள்ளே வாசம்பண்ணும் பரிசுத்த ஆவியானவர்', reference: '1 கொரிந்தியர் 3:16' },
          { id: 's10-ta-2', label: 'பரிசுத்த ஆவியானவரின் வழிநடத்துதல்', reference: 'யோவான் 14:26-27' },
          { id: 's10-ta-3', label: 'ஜெபத்திற்குப் பதில்', reference: 'யோவான் 14:14' },
          { id: 's10-ta-4', label: 'தேவதூதர்களின் உதவி', reference: 'எபிரெயர் 1:14' },
          { id: 's10-ta-5', label: 'அந்தகாரத்தின் மேல் அதிகாரம்', reference: 'லூக்கா 10:19' },
          { id: 's10-ta-6', label: 'பரலோகக் குடியுரிமை', reference: 'பிலிப்பியர் 3:20' },
          { id: 's10-ta-7', label: 'உலக சுவிசேஷம்', reference: 'அப்போஸ்தலர் 1:8' },
        ],
        footerLabel: 'இரட்சிப்பின் வழி',
      },
      en: {
        kicker: 'Part 10 · New Life in Christ',
        title: 'BLESSINGS OF THE CHILD OF GOD',
        subtitle: 'Seven Covenant Blessings Given to Every Believer',
        points: [
          { id: 's10-en-1', label: 'Indwelling Holy Spirit', reference: '1 Corinthians 3:16' },
          { id: 's10-en-2', label: 'Guidance of Holy Spirit', reference: 'John 14:26-27' },
          { id: 's10-en-3', label: 'Answered Prayer', reference: 'John 14:14' },
          { id: 's10-en-4', label: 'Help of Angels', reference: 'Hebrews 1:14' },
          { id: 's10-en-5', label: 'Authority over Darkness', reference: 'Luke 10:19' },
          { id: 's10-en-6', label: 'Heavenly Citizenship', reference: 'Philippians 3:20' },
          { id: 's10-en-7', label: 'World Evangelism', reference: 'Acts 1:8' },
        ],
        footerLabel: 'The Way of Salvation',
      },
      si: {
        kicker: '10 කොටස · ක්‍රිස්තුස් වහන්සේ තුළ නව ජීවිතය',
        title: 'දෙවියන් වහන්සේගේ දරුවාගේ ආශිර්වාද',
        subtitle: 'ගැළවීම ලැබූ දෙවියන් වහන්සේගේ දරුවාට හිමි ආශිර්වාද හත',
        points: [
          { id: 's10-si-1', label: 'අභ්‍යන්තරයේ වැඩවසන ශුද්ධාත්මයාණෝ', reference: '1 කොරින්ති 3:16' },
          { id: 's10-si-2', label: 'ශුද්ධාත්මයාණන්ගේ මඟපෙන්වීම', reference: 'යොහන් 14:26-27' },
          { id: 's10-si-3', label: 'යාච්ඤාවට පිළිතුරු', reference: 'යොහන් 14:14' },
          { id: 's10-si-4', label: 'දේවදූතයන්ගේ උපකාරය', reference: 'හෙබ්‍රෙව් 1:14' },
          { id: 's10-si-5', label: 'අඳුර පිට අධිකාරිය', reference: 'ලූක් 10:19' },
          { id: 's10-si-6', label: 'ස්වර්ගීය පුරවැසිභාවය', reference: 'පිලිප්පි 3:20' },
          { id: 's10-si-7', label: 'ලෝක ශුභාරංචි සේවය', reference: 'ක්‍රියා 1:8' },
        ],
        footerLabel: 'ගැළවීමේ මාර්ගය',
      },
    },
  },
];

function cloneContent(content: Slide['content']): Slide['content'] {
  return {
    ta: { ...content.ta, points: content.ta.points.map((p) => ({ ...p })) },
    en: { ...content.en, points: content.en.points.map((p) => ({ ...p })) },
    si: { ...content.si, points: content.si.points.map((p) => ({ ...p })) },
  };
}

export function createSlideFromBlueprint(
  order: number,
  themeId: ThemeId,
  customIdPrefix = 'slide'
): Slide {
  const theme = getThemeById(themeId);
  const blueprint = SALVATION_BLUEPRINTS[(order - 1) % SALVATION_BLUEPRINTS.length];
  const backdrop = STUDIO_BACKDROPS[blueprint.backdropIndex] ?? STUDIO_BACKDROPS[0];
  const now = new Date().toISOString();

  const isDense = blueprint.content.en.points.length >= 6;

  return {
    id: `${customIdPrefix}-${order}-${Math.random().toString(36).slice(2, 7)}`,
    order,
    isPrayerSlide: blueprint.isPrayerSlide,
    content: cloneContent(blueprint.content),
    design: {
      layout: blueprint.defaultLayout,
      fontFamily: theme.defaults.fontFamily,
      titleSize: blueprint.isPrayerSlide ? 44 : isDense ? 42 : 48,
      bodySize: blueprint.isPrayerSlide ? 21 : isDense ? 20 : 23,
      refSize: 16,
      textColor: theme.defaults.textColor,
      accentColor: theme.defaults.accentColor,
      backgroundColor: theme.defaults.backgroundColor,
      overlayOpacity: blueprint.isPrayerSlide ? Math.min(theme.defaults.overlayOpacity + 0.08, 0.85) : theme.defaults.overlayOpacity,
      overlayGradient: blueprint.isPrayerSlide
        ? theme.isLight
          ? 'light-sanctuary'
          : 'radial-vignette'
        : theme.defaults.overlayGradient,
      alignment: blueprint.isPrayerSlide ? 'center' : 'left',
      spacing: isDense ? 'compact' : 'comfortable',
      showReferences: true,
      referenceStyle: theme.defaults.referenceStyle,
      imagePosition: 'center',
      showSlideNumber: true,
    },
    background: {
      imageUrl: backdrop.imageUrl,
      source: 'studio',
      prompt: backdrop.defaultPrompt,
      assetId: backdrop.id,
    },
    lastUpdated: now,
  };
}

export function createSalvationPresentation(params: {
  title: string;
  subtitle: string;
  author: string;
  languageMode: ProjectLanguageMode;
  activeLanguage?: LanguageCode;
  slideCount?: number;
  format: PresentationFormat;
  themeId: ThemeId;
  completed?: boolean;
}): PresentationProject {
  const now = new Date().toISOString();
  const count = Math.min(Math.max(params.slideCount ?? 10, 1), 15);
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const slides: Slide[] = [];
  for (let i = 1; i <= count; i++) {
    if (i <= SALVATION_BLUEPRINTS.length) {
      slides.push(createSlideFromBlueprint(i, params.themeId, projectId));
    } else {
      const base = createSlideFromBlueprint(1, params.themeId, projectId);
      base.order = i;
      base.content.en.title = `CUSTOM SLIDE ${String(i).padStart(2, '0')}`;
      base.content.en.subtitle = 'Edit heading, points, and scripture references';
      base.content.en.points = [{ id: `custom-${i}-en`, label: 'Key Teaching Point', reference: '' }];
      base.content.ta.title = `கூடுதல் ஸ்லைடு ${String(i).padStart(2, '0')}`;
      base.content.ta.subtitle = 'தலைப்பு மற்றும் வேத வசனங்களைத் திருத்தவும்';
      base.content.ta.points = [{ id: `custom-${i}-ta`, label: 'முக்கிய போதனைப் புள்ளி', reference: '' }];
      base.content.si.title = `අමතර විනිවිදකය ${String(i).padStart(2, '0')}`;
      base.content.si.subtitle = 'මාතෘකාව සහ බයිබල් පද සංස්කරණය කරන්න';
      base.content.si.points = [{ id: `custom-${i}-si`, label: 'ප්‍රධාන ඉගැන්වීමේ කරුණ', reference: '' }];
      slides.push(base);
    }
  }

  const activeLanguage: LanguageCode =
    params.activeLanguage ?? (params.languageMode === 'all' ? 'en' : params.languageMode);

  return {
    id: projectId,
    title: params.title.trim() || 'The Way of Salvation',
    subtitle: params.subtitle.trim() || 'Present the Word. Share the Truth. Transform Lives.',
    author: params.author.trim() || 'Grace Covenant Church',
    languageMode: params.languageMode,
    activeLanguage,
    format: params.format,
    themeId: params.themeId,
    completed: Boolean(params.completed),
    slides,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialSeedProjects(): PresentationProject[] {
  const master = createSalvationPresentation({
    title: 'The Way of Salvation — Master Trilingual Edition',
    subtitle: 'Complete 10-Slide Gospel Presentation in Tamil, English & Sinhala',
    author: 'Sanctuary Media Ministry',
    languageMode: 'all',
    activeLanguage: 'en',
    slideCount: 10,
    format: '16:9',
    themeId: 'christian-cinematic',
    completed: true,
  });

  const tamilRevival = createSalvationPresentation({
    title: 'இரட்சிப்பின் வழி — ஞாயிறு ஆராதனை',
    subtitle: 'ஆதி மனிதன் முதல் தேவனுடைய பிள்ளையின் ஆசீர்வாதங்கள் வரை',
    author: 'புதிய ஜீவன் திருச்சபை',
    languageMode: 'ta',
    activeLanguage: 'ta',
    slideCount: 10,
    format: '16:9',
    themeId: 'golden-cross',
    completed: false,
  });

  return [master, tamilRevival];
}
