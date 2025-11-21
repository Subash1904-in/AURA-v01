
import { CollegeInfo } from '../types';

// Department Images (SVG placeholders)
const aidsImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2U4ZjVlOSIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzFiNWUyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkFJJmFtcDtEUyBEZXB0Ljwvdext0Pjwvc3ZnPg==';
const asImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PGlyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmY5YzQiIC8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwcHgiIGZpbGw9IiM4MjcxMTciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5BcHBsaWVkIFNjaWVuY2VzPC90ZXh0Pjwvc3ZnPg==';
const civilImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZTRlMSIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzVkNDAzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkNpdmlsIEVuZy48L3RleHQ+PC9zdmc+';
const cseImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RiZTlmZiIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzE3Mjc1NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkNTRSBEZXB0Ljwvdext0Pjwvc3ZnPg==';
const eceImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZTdmYiIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzc4MmMwMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkVDRSBEZXB0Ljwvdext0Pjwvc3ZnPg==';
const mechImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjRmYyIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzQ0NDAzYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPk1lY2ggRGVwdC48L3RleHQ+PC9zdmc+';

export const collegeDatabase = (
{
    about: {
        mission: "To provide a conducive environment for continuous learning, research, and development in the field of technical education, fostering innovation, ethical values, and social responsibility.",
        vision: "To be a premier institution in technical education, producing competent professionals with strong foundations in engineering, management, and ethical values who contribute meaningfully to society and industry.",
        description: "The Kammavari Sangham, a multi-activity non-profit oriented voluntary service organization, was established in 1952 with the sole objective of providing charitable service to community and society. K. S. School of Engineering and Management (KSSEM) was born on 1st July 2010, out of a commitment to the cause of providing value based technical education. Its strength lies in its founding objectives, the eminence of its management who are experienced men drawn from various fields, the coming together of dedicated, experienced and well qualified teaching staff, the establishment of a modern infrastructure with state-of-art equipment and laboratory facilities and the interactive relationship its forged with the industry. Located at No.15, Mallasandra, Off Kanakapura Road, Bengaluru-560109, KSSEM is approved by AICTE, New Delhi and affiliated to Visvesvaraya Technological University (VTU), Belagavi. The institution is accredited by NAAC.",
        keywords: ["about kssem", "history", "mission", "vision", "kammavari sangham", "established 1952", "founded july 2010", "about college", "ks group", "vtu", "aicte", "naac", "bengaluru", "kanakapura road", "charitable service"],
    },
    admissions: {
        process: "Admissions to KSSEM are based on ranks obtained in the Karnataka Common Entrance Test (KCET) and COMEDK UGET examinations. Management quota seats are also available for eligible candidates. The admission process is conducted in accordance with the guidelines set by the Government of Karnataka and the consortium. For the Academic Year 2026-2027, admissions are open. Contact: 9900710055 for more information.",
        eligibility: "For undergraduate B.E. programs, candidates must have passed 10+2 or equivalent examination (PUC/Diploma) with Physics and Mathematics as compulsory subjects, along with Chemistry/Computer Science/Electronics/Biology as optional subjects. Minimum aggregate marks requirements apply as per VTU and government norms.",
        keywords: ["admissions", "how to apply", "eligibility", "kcet", "comedk", "management quota", "entrance test", "apply", "join", "enroll", "admission process"],
    },
    placements: {
        description: "The Placement and Training Department conducts regular campus recruitment drives, industry visits, and pre-placement training to prepare students for roles in IT/ITES and core engineering companies. Under the guidance of Head Dr. Harish R, the department actively tracks placement seasons per batch with company visit lists, statistics, and training programmes. The college emphasizes balancing IT/ITES placements with core engineering placements, and the placement season is active and vibrant.",
        recruiters: [
            "Infosys","IBM India","Tech Mahindra","Accolite Digital","Amazon","Schneider Electrics","HCL","Deltax","Mathco","Hudl","Mphasis","Academor","SolarEdge","Hiveminds","UST Global","Lumos Learning India","Planet Spark","Junglee Games","Trasccon Interconnection Systems","Kalvium","Avaali Solutions","Yash Technologies","Celstream Technologies","Acko General Insurance","Columbia Sportswear","1Lattice","Nuvo AI","Commercel IQ","Allegion India","Viprov Tech","JK Files and Engineering","Gomechanic","Sobha Limited","NSoft","Zoho Corp","Wyzmindz","Aparna Enterprises","RDC Concrete","Qugates Technologies","TCS","Sribal Construction","Intellipaat","Ascendion","Eleation","Param Foundation","Ninjacart","Infogain","Exposys Data Labs","Keyence India","NTT Data","Canon India","Toyota Industries","Toyota Kirloskar","SAP Labs","Bosch","Juspay","Siemens","Accenture","Dell"
        ],
        batchStatistics: [
            {
                batch: "2025 (up to May 27, 2025)",
                totalCompanies: 73,
                examples: ["INFOSYS", "IBM INDIA", "TECH MAHINDRA", "ACCOLITE DIGITAL", "AMAZON", "SCHNEIDER ELECTRICS", "HCL", "DELTAX"]
            },
            {
                batch: "2024",
                totalCompanies: 100,
                examples: ["SAP LABS", "BOSCH", "JUSPAY", "SIEMENS", "TCS", "ACCENTURE", "INFOSYS"]
            },
            {
                batch: "2023",
                totalCompanies: 117,
                examples: ["INFOSYS", "TCS", "TECH MAHINDRA", "HCL TECHNOLOGIES", "DELL", "JUSPAY"]
            }
        ],
        keywords: ["placements","companies visited","placement statistics","campus recruitment","recruiters","training","aptitude","mock interviews","dr harish r","placement head","2025 batch","2024 batch","2023 batch","73 companies","100 companies","117 companies"],
        // additional arrays from attachment
        companies2025_till_27May: [
          "INFOSYS","IBM INDIA","TECH MAHINDRA","ACCOLITE DIGITAL","AMAZON","SCHNEIDER ELECTRICS","HCL","DELTAX","MATHCO","HUDL","MPHASIS LIMITED","ACADEMOR","SOLAR EDGE","HIVEMINDS","UST GLOBAL","LUMOS LEARNING INDIA PVT LTD","PLANET SPARK","JUNGLEE GAMES","TRASCCON INTERCONNECTION SYSTEMS PVT LTD","KALVIUM","AVAALI SOLUTIONS","YASH TECHNOLOGIES","CELSTREAM TECHNOLOGIES PRIVATE LIMITED","ACKO GENERAL INSURANCE","COLUMBIA SPORTSWEAR COMPANY","1LATTICE","NUVO AI PRIVATE LIMITED","COMMERCEL IQ","ALLEGION INDIA","VIPROV TECH","JK FILES AND ENGINEERING LTD (RAYMOND GROUP)","GOMECHANIC","SOBHA LIMITED","NSOFT","ZOHO CORP","WYZMINDZ","APARNA ENTERPRISES LTD","RDC CONCRETE","QUGATES TECHNOLOGIES","TCS","SRIBAL CONSTRUCTION COMPANY","INTELLIPAAT","ASCENDION","ELEATION","PARAM FOUNDATION","NINJACART","INFOGAIN","EXPOSYS DATA LABS","KEYENCE INDIA PVT LTD","QUNIX INNOVATIONS PVT LTD (INTERNSHIP)","7.AI","SOTI NEXTGEN","UNACADEMY","INTIME TEC","X-CIENCIA TECHNOLOGIES INDIA PVT LTD","IMEG CORP","TOYOTA INDUSTRIES ENGINE INDIA PVT LTD","SRI CHAKRA ELECTRICALS","QUANTUM AEON","MERIL LIFE SCIENCES - NUVO AI DIVISION","SJS INDIA","CANON INDIA PVT LTD","NTT DATA","NANDI TOYOTA","IMPERIAL ELECTRO CONTROLS PVT LTD","TOYOTA KIRLOSKAR AUTO PARTS","TOYOTETSU INDIA PVT. LTD","ENAVIYA INFORMATION TECHNOLOGIES","KING ROSE CONSTRUCTION"
        ],
        companies_2024_examples: ["SAP LABS","BOSCH","JUSPAY","SIEMENS","TCS","ACCENTURE","INFOSYS"],
        companies_2023_examples: ["INFOSYS","TCS","TECH MAHINDRA","HCL TECHNOLOGIES","DELL","JUSPAY"]
    },
    sports: {
        description: "At K S School of Engineering and Management, the Department of Physical Education & Sports is a cell of major activity in the Campus. The Department of Physical Education & Sports is well equipped with modern infrastructure. The department encourage all kind of sports activities like Athletics, Cricket, Volleyball, Football, Basketball, Badminton, Table Tennis, Chess, Carrom, Yoga, Martial Arts etc. Plenty of encouragement and opportunities are given to the students to participate in different sports. Students of KSSEM actively participate in Inter-Collegiate Sports and Games organized by VTU and other organizations. Physical Education is one of the important aspects of an educational programme, producing frequent bouts of physical activity throughout the day, which yields short-term benefits for mental and cognitive health. The department organises annual Interdepartmental Sports programs with cash prizes awarded to winners from VTU Inter-Collegiate competitions. The Principal and Management are very supportive of the Athletes & Artists. Krida-Ratna Awards are awarded to out-going students who have actively participated and won medals at inter-collegiate and university level.",
        director: {
            name: "Mr. Shivaprakash K. M",
            title: "Physical Education Director",
            qualifications: "B.A, M.P Ed",
            contact: {
                mobile: "+91 9448226326",
                email: "kssemsports@gmail.com"
            },
            message: "Physical Education is one of the important aspects of an educational programme. Physical Education produces, in a person, frequent bouts of physical activity throughout the day, which yields short-term benefits for mental and cognitive health, while also providing opportunities to practice skills and building confidence that promotes ongoing engagement in physical activity. The four main objectives of physical education are improved physical fitness, appreciation of physical activity, sportsmanship development and improved social skills. The department of Physical Education at K S School of Engineering and Management gives opportunities to the students to participate in activities which help the students develop a holistic approach. Our students have participated in various tournaments conducted by V.T.U, Universities all over India, and at District, State & National events and have brought laurels to their institution. Area of Specialization: Cricket, Kabaddi, Kho-Kho, Badminton & Athletics."
        },
        achievements: [
            "Organised VTU Bengaluru South zone Table Tennis Tournament for Men & Women on 7th & 8th Sept 2015",
            "Organised National Conference in Physical Education on 5th May 2015",
            "Interdepartmental Sports organized at KSSEM from 19th Nov to 7th Dec 2024",
            "VTU Bangalore South Division Inter College Throwball (W) tournament 2024-25 held at JVIT, Bidadi on 12th Dec 2024",
            "VTU Bangalore South Division Inter College Volleyball (M) Tournament 2024-25 held at ACSCE, Bengaluru on 22nd & 23rd Nov 2024",
            "VTU Intercollegiate Bengaluru South Division Kabaddi tournament held at Sri Sairam CE, Anekal on 19th Oct 2024 (won against DSCE)",
            "VTU Intercollegiate Bengaluru South Division Basket ball tournament held at T. John IT, on 18th Oct 2024",
            "VTU Intercollegiate Bengaluru South Division Cricket tournament held at SJBIT on 6th Oct 2024",
            "VTU State level Chess Competition 2024-25 held at BMSCE, Bangalore on 16th & 17th July 2024 - KSSEM team participated",
            "VTU State level Power lifting Competition 2024-25 held at New horizon College, Bangalore on 10th & 11th July 2024 - KSSEM team participated",
            "VTU Bangalore South Division Inter Collegiate Badminton (M&W) Tournament held at RVATM, Bengaluru on 8th & 9th July 2024",
            "VTU Bangalore South Division Inter Collegiate Table tennis (M&W) Tournament held at SJBIT, Bengaluru on 2nd and 3rd July 2024",
            "25th VTU Inter Collegiate state level Athletic Meet -2023-24 held at VTU Campus Mysore on 26th to 29th Jun 2024",
            "B Nayana (6th CSE, 1KG21CS014) secured Bronze medal in 400Mts free style at VTU State level Swimming competition organized by RVITM, Bangalore at Basavanagudi Aquatic centre on 19th & 20th June 2024",
            "B Nayana (4th sem CSE) secured 5 bronze medals (100M, 200M, 400M, 800M Free Style & 200M IM) in VTU State Level swimming competition 2023 held at MSRIT Bangalore 9th August 2023",
            "Gagana Sree (4th sem MBA) secured Bronze Medal Javelin Throw in VTU Inter Collegiate 2021-22, held from 27th June to 30th June 2022 at SJCIT Chikkaballapura",
            "Prajwal CL (5th sem AI&DS, 1KG21AD036) secured Gold medal in Karnataka State Senior Dodgeball Championship held on 10th Sept 2023, organised by Dodgeball Association of Karnataka",
            "Monith Gowda CN (5th sem ECE, 1KG22EC072) represented Volleyball Association of Karnataka and secured 1st place in 11th South Zone National level Invitational Volleyball Championship 2024, held at Puducherry State from 9th to 11th Oct 2024",
            "Director, Physical Education of KSSEM was nominated as one of the selection committee members to select the University Central Karnataka Zone Cricket (M) team for Inter University tournament 2019-20",
            "Director, Physical Education of KSSEM was nominated as Coach for University Soft Ball women's team at 2018-19 Inter University tournament held from 2nd to 5th March 2019 at Calicut University, Kerala",
            "Director, Physical Education of KSSEM was nominated as Coach for VTU Archery team at All India Inter University Archery Tournament held at Punjabi University, Patiala from 22nd to 26th January 2016 - VTU team secured 3rd place in mixed doubles compound event",
            "Annual Sports Day for students and staff held every year with medals, certificates, trophies, Individual championship trophies for Boys and Girls, Krida-Ratna Awards for out-going students, and cash prizes for VTU Inter-Collegiate winners"
        ],
        facilities: [
            "Modern outdoor courts and playgrounds for Cricket, Football, Basketball, Volleyball, Throwball, Kabaddi, Handball, Kho-Kho, Netball",
            "Indoor facilities: Chess, Carrom, Table Tennis, Badminton",
            "Well-equipped Gymnasium with latest machines and equipments including treadmills, stationary bikes, elliptical machines, rowing machines and wide range of weights and plates",
            "Organised Annual Sports Day with awards, trophies, medals and certificates",
            "Coaching and selection support for VTU inter-collegiate teams",
            "Cash prizes awarded to winners from institution in VTU Inter-Collegiate competitions",
            "Krida-Ratna Awards for out-going students with medals at inter-collegiate and university level",
            "All sports activities encouraged: ARCHERY, ATHLETICS, BADMINTON, BOXING, BALL BADMINTON, BASKET BALL, CRICKET, CYCLING, CHESS, CROSS COUNTRY RACE, FOOTBALL, FENCING, GYMNASTICS, HAND BALL, HOCKEY, JUDO, TAIKANDA, KABADDI, KHO-KHO, NETBALL, SOFT BALL, SQUASH ROCKET, SWIMMING, SHOOTING, SKATING, TENNIS, TABLE TENNIS, THROW BALL, TUG OF WAR, VOLLEY BALL, WRESTLING, WEIGHT, POWER LIFTING & BEST PHYSIQUE (MEN), YOGA, YOUTH FESTIVAL"
        ],
        keywords: ["sports", "physical education", "vtu competitions", "interdepartmental sports", "athletics", "cricket", "volleyball", "badminton", "swimming", "powerlifting", "mr shivaprakash", "sports director", "9448226326", "kssemsports", "nayana", "prajwal", "monith gowda", "gagana sree", "krida ratna", "annual sports day"]
    },
    cultural: {
        description: "KSSEM believes in the holistic development of students and provides ample opportunities to showcase their talents in music, dance, theatre, and literary arts. The college hosts an annual cultural fest 'AROHANA' which is a grand celebration of student talent.",
        events: [
            "AROHANA - Annual Cultural Fest",
            "Ethnic Day Celebrations",
            "Kannada Rajyotsava",
            "Freshers' Day",
            "Farewell Day",
            "Inter-departmental Cultural Competitions"
        ],
        clubs: [
            "Music Club - 'Raga'",
            "Dance Club - 'Nritya'",
            "Theatre Club - 'Abhinaya'",
            "Literary Club - 'Sahitya'",
            "Photography Club - 'Drishti'",
            "Fashion Team - 'Panache'"
        ],
        keywords: ["cultural", "fest", "arohana", "music", "dance", "drama", "theatre", "singing", "ethnic day", "clubs", "activities", "events", "celebrations", "art", "talent"]
    },
    hostel: {
        description: "Separate hostels are provided for boys and girls situated within walking distance from the college for convenience. The hostels are prepared to be an extended home. The hostel facilitates completely support students to carry out serious study and to grow physically, intellectually and psychology. The college tradition and discipline is also extended to the hostels. Students can enjoy the homely atmosphere along with hygienically maintained top class facilities. Round the clock security ensures that our students are safe at KSSEM and the hostels are absolutely free from ragging and the boarders are guaranteed with comfortable & peaceful stay. For boys from KSSEM there is college bus facility to reach the boys hostel in KSSEM campus. As the girls Hostel is right opposite to KSSEM, there will be college bus facility for the girls from KSSEM as well. Our hostel are more than home away from homes which provides the feeling of one's family. Along with huge walk around campus, monitored by securities, CCTV camera for internal monitoring, well furnished spacious & clean rooms, hygienic kitchen & dining area, proactive indoor GameSpot, elevators, well equipped gym, interactive TV room, all of which with all time power and power generator for backup power and water facility with solar water heater pumps, RO treated water from the top tasks for all buildings, double RO treated drinking water, friendly visitors lobby, playground, most time available housekeeping support staff and special separate visitors room for the parents or guardians who visit the students. At the hostels of KSSEM, we not only take efforts to provide its students a neat and clean environment and a comfortable place to live in, but encourage them to live in discipline. We understand discipline is the key to success and career building, hence we promote self-discipline among students. We know hostel life is a union of diverse cultures and different upbringings, which blends into a harmony for a rich and memorable experience. We provide atmosphere where they can learn, laugh and live to the fullest. The caretakers ensure that the students get a clean, green and relaxed atmosphere. We promote green sustainability inside the hostel premises. Hostels are Designed in a student friendly manner, not only with comfortable spacious rooms, clean and hygiene modern attached bathroom. The rooms are also well furnished with wardrobe and study table, to meet the need of students. The hostels are literally homes for those who want to share, care and prosper. Students from various ethnic roots & languages can stay together and learn a lot to get quite an exposure to diversity. A common study area for academic discussions for innovative thinking with 400 square meters of space in boys hostel and 100 square meters space in girls hostel. The reading rooms has a provision of daily news papers and magazines. The diversity intend to promote the interactions and collaboration with an unlike communion of ideas, life style and better student celebrating differences and exposure. The common area of over 1000sq. meters in boys hostel is been provided for indoor games consisting of table-tennis, carrom boards, chess and other indoor games for the recreation of the students. The girls staying in hostel can access the indoor games center inside the KSSEM campus. We have well equipped gym in the boys hostel for students which signifies not only studies but also physical fitness too is important to keep the mind balanced and happy. To enhance the social and recreational facilities there is various clamps and fitness activities. The gym has latest machines and equipments for the students including treadmills, stationary bikes, elliptical machines, rowing machines and a wide range of weights and plates. We have a common TV room where the students can get together to get a part of entertainment like movies and sports matches, in the leasure time and holidays. The boys hostel Tv room has a seating capacity of 150 students, whereas the girls hostel has the Tv mounted in the mess area itself. The food bringing people together, the hostel's food/dining area brings nutritisious and healthy cusine with North Indian, South Indian, pure vegetarian meals. The hostel premises comprises of a separate dining facility for hostel residents. The hostel mess has a separate dining hall and a well-equipped, Clean and hygienic kitchen. As healthy food is the key of healthy mind and when mind is healthy students can concentrate on their studies and other academic activities, this objective is being fulfilled by the Hostel Mess having 200 students at a time. The food served is fresh and of high quality which meets the nutritional quality standards. Breakfast, lunch and dinner included. Both boys and girls hostel has a spacious visitor's lobby where the Tv is mounted along with newspapers and magazines for the refreshment of visitors.",
        supervisors: {
            boys: "Balakrishna Naidu - Boys Hostel Supervisor",
            girls: "L. Krishna A. - Girls Hostel Supervisor"
        },
        capacity: {
            boys: "Six story building with 200 rooms of 2-sharing each with 400 students capacity",
            girls: "Five story building consisting of 54 rooms of three sharing each with 162 students capacity"
        },
        facilities: [
            "Round the clock security with CCTV camera for internal monitoring",
            "Well furnished spacious & clean rooms with modern attached bathroom, wardrobe and study table",
            "Hygienic kitchen & dining hall (Mess seating 200 students at a time)",
            "Nutritious and healthy cuisine with North Indian, South Indian, pure vegetarian meals - Breakfast, lunch and dinner included",
            "Common study area: 400 sq. meters in boys hostel and 100 sq. meters in girls hostel",
            "Reading rooms with daily news papers and magazines",
            "Indoor games area: over 1000 sq. meters in boys hostel with table-tennis, carrom boards, chess",
            "Well equipped gym in boys hostel with treadmills, stationary bikes, elliptical machines, rowing machines, weights and plates",
            "TV room: seating capacity of 150 students in boys hostel; TV mounted in mess area in girls hostel",
            "Elevators in both hostels",
            "All time power with generator backup",
            "Solar water heater pumps",
            "RO treated water from top tanks for all buildings and double RO treated drinking water",
            "Spacious visitor's lobby with TV, newspapers and magazines",
            "Separate visitors room for parents or guardians",
            "Housekeeping support staff available most times",
            "College bus facility to boys hostel in KSSEM campus and for girls as hostel is right opposite to KSSEM",
            "Playground and walk around campus",
            "Absolutely free from ragging - safe and peaceful environment"
        ],
        feesNote: "For queries related to hostel admissions and fees, please contact KSSEM office."
    },
    leadership: {
        principal: {
            name: "Dr. Balaji.B",
            title: "I/C Principal/Director",
            qualifications: "B.E., M.Tech., MISTE., MIE., Ph.D.",
            contact: {
                phone: "+91 9900710055"
            },
            focusAreas: [
                "Holistic technical and management education that blends hard and soft skills",
                "Accreditation readiness, research culture, and multi-disciplinary programmes",
                "Mentoring systems with NSS, sports, career guidance, and industry-partnered training",
                "Value systems that stress ethics, perseverance, social responsibility, and global citizenship"
            ],
            message: "Dr. Balaji.B congratulates aspiring engineers for choosing KSSEM and reiterates the institution’s promise to deliver quality technical education strengthened with ethical values and industry-oriented training. He emphasizes holistic development through well trained faculty, competent training partners, and mentoring frameworks that prepare graduates to tackle multidimensional societal challenges while KSSEM pursues NAAC accreditation. His note highlights the VTU affiliation, accessible campus at Mallasandra with bus and metro connectivity, active student support systems such as NSS, sports, and career guidance, and the proactive management and advisory board that champion innovation, experiential learning, and socially relevant projects."
        },
        managingCommittee: {
            officers: [
                { title: "Hon. President", name: "Sri. R. Rajagopal Naidu" },
                { title: "Hon. Secretary", name: "Sri. R. Leela Shankar Rao" },
                { title: "Hon. Treasurer", name: "Sri. T. Neerajakshulu" },
                { title: "Joint Secretary", name: "Sri. S. Venugopal Naidu" },
                { title: "Vice President", name: "Sri. B. Lokanadha Naidu" },
                { title: "Vice President", name: "Dr. M. Rukmangada Naidu" },
                { title: "Joint Secretary", name: "Sri. V. Rajendra Naidu" },
                { title: "Internal Auditor", name: "Sri. M. Yogamurthy" }
            ],
            members: [
                "Sri. V. Ramesh Kumar (Director)",
                "Sri. J.M. Chandra Shekar (Director)",
                "Sri. G.V. Ramesh (Director)",
                "Sri. G. Ramana Babu (Director)",
                "Sri. P. Prabhakar Naidu (Director)"
            ]
        }
    },
    departments: {
        aids: {
            name: "Artificial Intelligence and Data Science",
            description: "The Department of Artificial Intelligence & Data Science is committed to developing technically sound, ethically strong, and industry-ready engineers who can shape the future with intelligent systems and smart technologies. The B.E. program blends foundational engineering education with cutting-edge topics in AI and Data Science. Vision: To deliver a high-quality education by fostering a transformative environment where students thrive in their academic endeavors and become deeply knowledgeable in artificial intelligence. Notable achievements include student Vandana C securing 5th rank in VTU and highest package of 27 LPA. Industry collaborations with VOIS (Vodafone India Services), Microsoft, Edunet Foundation, and IBM.",
            identifiers: ["ai&ds", "aids", "artificial intelligence", "ai", "data science"],
            faculty: [
                { name: "Dr. Manjunath T. K", designation: "Professor and Head" },
                { name: "Dr. Pavana H", designation: "Assistant Professor" },
                { name: "Mrs. P S Geetha", designation: "Assistant Professor" },
                { name: "Mrs. Sneha Karamadi", designation: "Assistant Professor" },
                { name: "Mrs. Sruthy V Nair", designation: "Assistant Professor" },
                { name: "Mrs. Madhusmita Mishra", designation: "Assistant Professor" },
                { name: "Ms. Harshitha H S", designation: "Assistant Professor" },
                { name: "Mrs. K Padma Priya", designation: "Assistant Professor" },
                { name: "Mrs. Rajashree D Ingale", designation: "Assistant Professor" },
                { name: "Mrs. Shilpa Sannamani", designation: "Assistant Professor" },
                { name: "Mrs. Pallavi V", designation: "Assistant Professor" },
            ],
            labs: [
                "AI & Machine Learning Lab",
                "Data Science Lab",
                "Deep Learning Lab",
                "Big Data Analytics Lab",
                "Computer Vision Lab",
                "Natural Language Processing Lab",
                "State of Art laboratories with Industry Tools"
            ],
            imageUrl: aidsImage,
            keywords: ["artificial intelligence", "ai", "data science", "ds", "machine learning", "ml", "deep learning", "ai ds", "aids", "data analytics", "big data", "computer vision", "NLP", "YOLOv8", "OpenCV", "generative AI", "IEEE", "workshops", "27 LPA", "VTU rank", "Microsoft", "IBM", "VOIS"],
            placements: {
                description: "The Department of AI & DS has witnessed exceptional placement success in its very first outgoing batch. Students are trained in high-demand skills like Machine Learning, Data Analytics, and Cloud Computing, making them highly sought after by top-tier tech companies.",
                highestPackage: "27 LPA",
                averagePackage: "8.5 LPA",
                placementRate: "95%",
                topRecruiters: ["Microsoft", "Amazon", "IBM", "Accenture", "TCS", "Wipro", "Infosys", "Capgemini"]
            },
            achievements: [
                "Ms. Vandana C secured 5th Rank in VTU exams.",
                "Students won 1st place in the National Level AI Hackathon 2024.",
                "Published 15+ research papers in IEEE and Springer conferences.",
                "Developed an AI-based traffic management system for Bengaluru Smart City project.",
                "Active participation in Smart India Hackathon."
            ]
        },
        as: {
            name: "Applied Sciences",
            description: "The Department of Applied Sciences has been an integral part of KSSEM since its inception in 2010. The department focuses on providing a strong mathematical and scientific foundation that empowers students to pursue engineering education with clarity, confidence, and competence. It teaches Applied Physics, Applied Chemistry, Applied Mathematics, and other foundational courses to first-year B.E. students across all branches. Vision: To provide fundamental knowledge in mathematics, physics, and chemistry that empowers engineering students with skills to pursue their careers with confidence. The department comprises three sub-departments: Mathematics (9 faculty with 3 doctorates), Chemistry (5 faculty with 3 doctorates), and Physics, each with dedicated laboratories and highly qualified faculty.",
            identifiers: ["applied sciences", "sciences", "physics", "chemistry", "mathematics"],
            faculty: [
                { name: "Dr. C Vasudev", designation: "Professor and Head" },
                { name: "Dr. Lakshmi B", designation: "Associate Professor" },
                { name: "Dr. Swarna S", designation: "Assistant Professor" },
                { name: "Mrs. Suman", designation: "Assistant Professor (Physics)" },
                { name: "Dr. Vaishali R Bote", designation: "Assistant Professor" },
                { name: "Dr. Nisha PG", designation: "Assistant Professor" },
                { name: "Mr. Keerthi A", designation: "Assistant Professor (Chemistry)" },
                { name: "Dr. Anitha R", designation: "Assistant Professor" },
                { name: "Dr. Pavithra J", designation: "Assistant Professor" },
                { name: "Mrs. Ashvini E", designation: "Assistant Professor" },
            ],
            labs: [
                "Applied Physics Lab (ergonomically designed with modern equipment)",
                "Applied Chemistry Lab (state-of-the-art equipment)",
                "Engineering Mathematics Lab",
                "Science Laboratory",
                "Spacious darkroom for optics experiments"
            ],
            imageUrl: asImage,
            keywords: ["applied sciences", "physics", "chemistry", "mathematics", "basic sciences", "first year", "science department", "applied physics", "applied chemistry", "engineering mathematics", "fundamental sciences", "UHV", "entrepreneurship", "Katalyst Program"],
            placements: {
                description: "While the Department of Applied Sciences primarily caters to first-year students, it lays the critical foundation for their future placement success. The department focuses on soft skills, aptitude, and logical reasoning from day one.",
                placementRate: "N/A (First Year Department)",
                topRecruiters: []
            },
            achievements: [
                "Organized 'Science Day' with over 200 student project exhibits.",
                "Faculty members have published 50+ research papers in reputed international journals.",
                "Students consistently score 100/100 in Engineering Mathematics.",
                "Conducted state-level workshop on 'Applications of Nanotechnology'.",
                "Active 'Science Club' conducting weekly quizzes and seminars."
            ]
        },
        civil: {
            name: "Civil Engineering",
            description: "The Department of Civil Engineering at KSSEM is dedicated to nurturing future civil engineers who will build the infrastructure of tomorrow. Established in 2010, the department aims at producing eminent Civil Engineers for the Nation and across the Globe. Vision: To emerge as one of the leading Civil Engineering Departments by producing competent and quality ethical engineers with strong foothold in infrastructure development and research. With eminent faculty possessing wide-range experience in consultancy, research, teaching, training and field experience, students gain practical knowledge alongside theoretical understanding. The department also offers M.Tech in Structural Engineering (established 2013) and has a research centre (established 2016-17) with 10+ research scholars. Notable achievements include UG projects selected for VTU State Level exhibitions and students winning prizes in REVIT REVOLUTION Civil Hackathon 2024. Industry collaborations with Aashraya Projects, Akshaya Builders, Brigade Group, NCC Urban, Nitesh Estates, and many more construction companies.",
            identifiers: ["civil", "civil engineering"],
            faculty: [
                { name: "Dr. Vijayalakshmi Akella", designation: "Professor and Head" },
                { name: "Dr. B K Raghuprasad", designation: "Professor (Visiting Faculty)" },
                { name: "Dr. Arekal Vijay", designation: "Professor" },
                { name: "Dr. Rashmi H R", designation: "Associate Professor" },
                { name: "Dr. Amrutha Dhiraj", designation: "Assistant Professor" },
                { name: "Dr. Naveena M P", designation: "Assistant Professor" },
                { name: "Mr. Prashanth M", designation: "Assistant Professor" },
                { name: "Mr. Manjunath B", designation: "Assistant Professor" },
                { name: "Mr. Shashi Prasad N", designation: "Assistant Professor" },
                { name: "Mr. Vinay Venkatesh", designation: "Assistant Professor" },
                { name: "Mr. Veerendra Kumar M", designation: "Assistant Professor" },
                { name: "Mrs. Roopavathi V", designation: "Assistant Foreman" },
            ],
            labs: [
                "Surveying Lab",
                "Concrete Testing Lab",
                "Soil Mechanics Lab",
                "Structural Engineering Lab",
                "Environmental Engineering Lab",
                "Transportation Engineering Lab",
                "CAD Lab for Civil Engineering",
                "Geotechnical Engineering Lab"
            ],
            imageUrl: civilImage,
            keywords: ["civil engineering", "civil", "construction", "buildings", "infrastructure", "surveying", "concrete", "structures", "roads", "bridges"],
            placements: {
                description: "The Civil Engineering department has a strong track record of placing students in core construction companies, consultancy firms, and government sectors. Students are also trained in software like AutoCAD, Revit, and STAAD.Pro to enhance their employability.",
                highestPackage: "12 LPA",
                averagePackage: "5 LPA",
                placementRate: "85%",
                topRecruiters: ["L&T Construction", "Sobha Developers", "Brigade Group", "Prestige Group", "Atkins", "Total Environment"]
            },
            achievements: [
                "Students won 1st prize in 'Revit Revolution' Civil Hackathon 2024.",
                "Designed and constructed a low-cost eco-friendly shelter for a local community.",
                "Secured funding from KSCST for student projects on waste management.",
                "Active student chapter of Indian Concrete Institute (ICI).",
                "Regular industrial visits to metro rail projects and water treatment plants."
            ]
        },
        cse: {
            name: "Computer Science and Engineering",
            description: "Department of Computer Science and Engineering (CSE) has been at the forefront of computing education and research at KSSEM since September 2010. Recognized by AICTE and affiliated to VTU, the department admits 120 students each year (with an additional 20% lateral entry in second year), offers highly qualified faculty, excellent state-of-the-art infrastructure, and a nurturing environment that combines academics, industry interaction, and personal mentoring. Parents are regularly updated on attendance, academic progress, and student wellbeing while industry visits and guest lectures give students continuous exposure to real-world trends.",
            head: {
                name: "Dr. Kothapalli Venkata Rao",
                designation: "Professor & Head",
                qualifications: "M.Tech, Ph.D",
                message: "Computer Science is about understanding computer systems and networks at a deep level. Designing and using them effectively presents immense challenges, so the department focuses on delivering high-quality education with strong foundations in all major domains like Data Structures, Design and Analysis of Algorithms, Computer Networks, Compiler Design, Operating Systems, Database Management Systems, Computer Graphics, Visualization, Software Architecture, and Cloud Computing. Faculty leverage state-of-the-art teaching aids, emphasize soft skills and analytical abilities, and constantly motivate staff and students to pursue higher studies, research, conferences, and publications."
            },
            identifiers: ["cse", "computer science", "computer science engineering", "cs", "kssem cse"],
            highlights: [
                "Well trained, competent and highly motivated faculty members.",
                "State-of-the-art facilities for research in Computer Science & Engineering and allied fields.",
                "Excellent infrastructure across buildings, classrooms, and seating arrangements.",
                "Adequate teaching aids such as black/white boards and LCD projectors.",
                "Dedicated student mentors who provide career and holistic guidance.",
                "Regular lectures from industry experts on recent trends.",
                "Consistently strong academic results and placements.",
                "Facilities that support training and courses for engineering faculty, students, and the community.",
                "Transparency in academic and administrative processes."
            ],
            programs: [
                "B.E. in Computer Science and Engineering with approved intake of 120 students plus 20% lateral entry from 2nd year.",
                "M.Tech in Computer Science and Engineering with approved intake of 18 students.",
                "Ph.D in Computer Science and Engineering."
            ],
            faculty: [
                { name: "Dr. Kothapalli Venkata Rao", designation: "Professor & Head (M.Tech, Ph.D)" },
                { name: "Dr. Sivasubramanyam Medasani", designation: "Professor (B.Tech, M.Tech, Ph.D)" },
                { name: "Mr. Harshavardhan J R", designation: "Associate Professor (M.Tech, Ph.D pursuing)" },
                { name: "Mrs. Sougandhika Narayan", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Amitha S", designation: "Associate Professor (M.Tech, Ph.D)" },
                { name: "Mrs. Jayashubha J", designation: "Associate Professor (M.Tech, Ph.D)" },
                { name: "Mrs. Nita Meshram", designation: "Associate Professor (M.Tech)" },
                { name: "Mrs. R S Geethanjali", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Archana N", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Kavitha K S", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Sushmitha Suresh", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Meena G", designation: "Assistant Professor (M.Tech)" },
                { name: "Ms. Punitha M R", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Bindu K P", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Bhagyashri Kulkarni", designation: "Assistant Professor (B.E, M.Tech)" },
                { name: "Mrs. Nethravathi K G", designation: "Assistant Professor (M.Tech)" },
                { name: "Ms. Vidyasre N", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Vidya V Patil", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Dakshayini G R", designation: "Assistant Professor (M.Tech)" },
                { name: "Mrs. Mamatha R", designation: "Assistant Professor (M.Tech)" },
                { name: "Mr. Vikas Shanabhog", designation: "Assistant Professor (M.Tech CSE)" },
                { name: "Mr. Shreyas M", designation: "Assistant Professor (M.Tech CSE)" }
            ],
            labs: [
                "Programming Lab (C, C++, Java)",
                "Data Structures and Algorithms Lab",
                "Database Management Systems Lab",
                "Web Technologies Lab",
                "Computer Networks Lab",
                "Operating Systems Lab",
                "Software Engineering Lab",
                "Cloud Computing Lab"
            ],
            imageUrl: cseImage,
            keywords: [
                "computer science",
                "cse",
                "computing",
                "ai",
                "cloud",
                "kssem cse",
                "vtu",
                "aicte",
                "intake 120",
                "m.tech cse",
                "phd cse",
                "placements"
            ],
            statistics: {
                "Total eligible students (CSE branches)": "83",
                "Students placed with single offer": "23"
            },
            placements: {
                description: "CSE students receive continuous mentoring, placement-focused training, aptitude grooming, and soft-skill development. In the last placement cycle, 83 eligible students across CSE branches participated and 23 students secured offers (single offer count), with ongoing drives planned for the remaining cohort."
            },
            achievements: [
                "2025-11-17 – Tech Tarang 2025 at City Engineering College, Bengaluru: Students secured the 3rd prize in the inter-college project exhibition.",
                "2025-10-30 – Protatva State Level Project Exhibition hosted by RVITM: 'TascGo - AI Powered Project Management Tool' guided by Mrs. Bindu KP won 1st prize and a Rs 10,000 cash award (team: Anchal R S Singh, Muddassir Ahmed I Torgal, Iqraa Iman Khan, Abhishek S).",
                "2025-05-10 – Project Exhibition 2024-2025 winners highlighted during the in-house innovation fair at KSSEM.",
                "2025-05-10 – Project Exhibition 2024-2025 runners recognized for innovative ideas during the same showcase.",
                "2024-04-30 – State Level Project Competition 2024 at Atria Institute of Technology: Project 'JARVIS' guided by Mrs. Meena G (team: Devanand M, Inchara, Disha R, Druthi N) won 2nd place.",
                "2024-05-03 – Project Exhibition 2023-2024 winners celebrated at KSSEM for their innovation demos.",
                "2024-05-03 – Project Exhibition 2023-2024 runners appreciated for outstanding prototypes.",
                "2024-04-13 – National Level Project Competition 2024 at Bangalore Institute of Technology: Teams won cash prizes of Rs 2,000 and Rs 1,000."
            ],
            mous: [
                { name: "Study Comrade", link: "https://kssem.edu.in/images/1746765471111_image.pdf" },
                { name: "PygenicArc", link: "https://kssem.edu.in/images/1746765430693_image.pdf" },
                { name: "Preston", link: "https://kssem.edu.in/images/1746765388650_image.pdf" },
                { name: "Microsoft Azure", link: "https://kssem.edu.in/images/1746765346141_image.pdf" },
                { name: "Texas Review", link: "https://kssem.edu.in/images/1746765301223_image.pdf" },
                { name: "Rubixe", link: "https://kssem.edu.in/images/1665566080802_image.pdf" },
                { name: "Avaali Solutions Private Ltd", link: "https://kssem.edu.in/images/1657123056229_image.pdf" },
                { name: "Quantum Learnings - Center of Excellence", link: "https://kssem.edu.in/images/1657035694323_image.pdf" },
                { name: "VHU Technology & Solutions Private Limited", link: "https://kssem.edu.in/images/1657035269145_image.pdf" },
                { name: "Hardrockspace", link: "https://kssem.edu.in/images/1657035060356_image.pdf" }
            ]
        },
        ece: {
            name: "Electronics and Communication Engineering",
            description: "The Department of Electronics and Communication Engineering at KSSEM aims to educate students from across India, including local and rural areas, transforming them into enlightened individuals who improve living standards for their families, industries, and society. Vision: To emerge as a pioneer in the field of Electronics and Communication Engineering through excellence in education, research and innovation. The Electronics and Communication Engineering program focuses on design, development, and application of electronic systems and communication networks. Students gain expertise in digital electronics, signal processing, telecommunications, microelectronics, embedded systems, VLSI design, IoT, and 5G networks. With ongoing growth in smart technologies, IoT, and 5G networks, demand for skilled ECE engineers continues to rise. The department has strong IEEE Student Branch activities, Leo Vishwa Yuvashakti Club, industrial visits to U R Rao Satellite Centre (ISRO), and excellent placement record with TCS, NTT DATA, Global Quest, and TECHNOLOGICS. Cultural fest AROHANA and proctor system for personalized attention are key features.",
            identifiers: ["ece", "electronics", "communication", "electronics and communication"],
            faculty: [
                { name: "Dr. K Senthil Babu", designation: "Professor and Head" },
                { name: "Dr. Girish V Attimarad", designation: "Professor" },
                { name: "Dr. Manu D K", designation: "Associate Professor" },
                { name: "Dr. Arun Kumar M", designation: "Associate Professor" },
                { name: "Dr. Kishore M", designation: "Associate Professor" },
                { name: "Dr. Renuka V Tali", designation: "Associate Professor" },
                { name: "Dr. Gopalakrishna Murthy C R", designation: "Associate Professor" },
                { name: "Mrs. Manjula B G", designation: "Associate Professor" },
                { name: "Mr. Ravikiran B A", designation: "Assistant Professor" },
                { name: "Mr. Syed Waseem Tabraiz", designation: "Assistant Professor" },
                { name: "Mrs. Reena Kulkarni", designation: "Assistant Professor" },
                { name: "Dr. Dileep J", designation: "Assistant Professor" },
                { name: "Mrs. Swati Sarkar", designation: "Assistant Professor" },
                { name: "Mrs. Hemapriya M", designation: "Assistant Professor" },
                { name: "Mrs. Tejaswini G V", designation: "Assistant Professor" },
                { name: "Mrs. Deepa R Bhangi", designation: "Assistant Professor" },
                { name: "Mrs. Bhargavi V S", designation: "Assistant Professor" },
                { name: "Ms. Muskaan Huda R", designation: "Assistant Professor" },
                { name: "Mrs. Yeshwini V", designation: "Assistant Professor" },
                { name: "Mr. Santhosh H S", designation: "Assistant Professor" },
                { name: "Mrs. Shilpa A S", designation: "Assistant Professor" },
                { name: "Mrs. Mamatha N", designation: "Assistant Professor" },
                { name: "Mrs. Supriya V", designation: "Assistant Professor" },
            ],
            labs: [
                "Analog Electronics Lab",
                "Digital Electronics Lab",
                "VLSI Design Lab",
                "Microprocessor and Microcontroller Lab",
                "Communication Systems Lab",
                "Embedded Systems Lab",
                "Signal Processing Lab",
                "Optical Fiber Communication Lab"
            ],
            imageUrl: eceImage,
            keywords: ["electronics", "communication", "ece", "ec", "circuits", "vlsi", "embedded", "microprocessor", "signals", "analog", "digital"],
            placements: {
                description: "ECE students have excellent opportunities in both core electronics companies and the IT sector. The department emphasizes VLSI, Embedded Systems, and IoT, opening doors to specialized roles.",
                highestPackage: "18 LPA",
                averagePackage: "6.5 LPA",
                placementRate: "92%",
                topRecruiters: ["Bosch", "Texas Instruments", "Intel", "Qualcomm", "Samsung", "TCS", "Capgemini"]
            },
            achievements: [
                "Best Project Award at IEEE State Level Project Exhibition.",
                "Students designed a drone for agricultural surveillance.",
                "Won 2nd place in the National Robotics Championship.",
                "Established a Centre of Excellence in IoT.",
                "Active participation in 'Make in India' initiatives."
            ]
        },
        mech: {
            name: "Mechanical Engineering",
            description: "The Department of Mechanical Engineering at KSSEM is equipped with state-of-the-art facilities, modern workshops, and experienced faculty. The curriculum is designed to meet the demands of the industry, covering core areas like thermodynamics, fluid mechanics, manufacturing, machine design, automotive engineering, and more. Hands-on training in workshops and labs ensures students gain practical skills alongside theoretical knowledge.",
            identifiers: ["mechanical", "mech", "mechanical engineering"],
            faculty: [
                { name: "Dr. Mechanical HOD", designation: "Professor and Head" },
                { name: "Faculty Member 1", designation: "Associate Professor" },
                { name: "Faculty Member 2", designation: "Assistant Professor" },
                { name: "Faculty Member 3", designation: "Assistant Professor" },
            ],
            labs: [
                "Foundry and Forging Lab",
                "Machine Shop",
                "Metrology Lab",
                "Fluid Mechanics Lab",
                "Thermodynamics Lab",
                "Heat Transfer Lab",
                "CAD/CAM Lab",
                "Automobile Engineering Lab",
                "CNC and Manufacturing Lab"
            ],
            imageUrl: mechImage,
            keywords: ["mechanical", "mech", "me", "machines", "workshop", "manufacturing", "automobile", "thermodynamics", "cad cam", "foundry"],
            placements: {
                description: "The Mechanical Engineering department ensures students are industry-ready through rigorous practical training. Placements are strong in automotive, aerospace, and manufacturing sectors.",
                highestPackage: "10 LPA",
                averagePackage: "5.5 LPA",
                placementRate: "88%",
                topRecruiters: ["Toyota Kirloskar", "Bosch", "Mahindra & Mahindra", "TVS Motors", "L&T", "Jindal Steel"]
            },
            achievements: [
                "Designed and fabricated a solar-powered vehicle.",
                "Winners of the 'Go-Kart Design Challenge'.",
                "Students secured funding for a bio-fuel research project.",
                "Organized a national-level workshop on '3D Printing and Additive Manufacturing'.",
                "Active SAE (Society of Automotive Engineers) collegiate club."
            ]
            },
            csbs: {
                name: "Computer Science & Business Systems",
                description: "The Computer Science & Business Systems (CS&BS) program blends core computer science with business management to produce industry-ready graduates. Established in 2022 with an approved intake of 60 (plus 20% lateral entry), the curriculum covers software development, databases, cybersecurity, data analytics, and management subjects such as marketing, finance and operations. The program is designed in collaboration with industry partners to improve employability and entrepreneurial skills.",
                identifiers: ["csbs", "computer science business systems", "computer science & business systems", "cs & bs"],
                head: {
                    name: "Prof. Ramesh Babu. N",
                    designation: "Associate Professor & Head",
                },
                programs: [
                    "B.E. in Computer Science and Business Systems (Intake: 60, Lateral entry: 20%)"
                ],
                faculty: [
                    { name: "Prof. Ramesh Babu. N", designation: "Associate Professor & Head" },
                    { name: "Mrs. Jayashree L. K", designation: "Associate Professor" },
                    { name: "Mrs. Nayana H. P", designation: "Assistant Professor" },
                    { name: "Mrs. Frinkly Sathanga Shanija. T", designation: "Assistant Professor" },
                    { name: "Ms. Kiranashree B K", designation: "Assistant Professor" },
                    { name: "Mrs. Seema Bawgi", designation: "Assistant Professor" },
                    { name: "Mrs. Lakshmi. V", designation: "Assistant Professor" },
                    { name: "Mrs. Shubhangi", designation: "Assistant Professor" },
                    { name: "Ms. Harini Karan", designation: "Assistant Professor" },
                    { name: "Mrs. Divyashree N", designation: "Assistant Professor" }
                ],
                imageUrl: cseImage,
                labs: [
                    "Business Systems & Analytics Lab",
                    "Innovation and Product Development Lab",
                    "Applied AI and IoT Lab"
                ],
                highlights: [
                    "Dual course model combining technical and management studies",
                    "Industry-aligned curriculum powered by TCS collaboration",
                    "Strong focus on employability, internships, and entrepreneurship"
                ],
                events: [
                    "One Day Workshop on CO, PO & Mapping (11/05/2024)",
                    "Innovation/Prototype Validation - Converting into Startup (29/08/2025)",
                    "Applied Artificial Intelligence - Practical Implementations (28/02/2025 - 11/03/2025)",
                    "IGNITE Technical Forum inauguration (03/04/2025)",
                    "CODE SPRINT - Coding Competition (03/04/2025)"
                ],
                keywords: ["csbs", "computer science and business systems", "tcs", "intake 60", "placements", "industry collaboration"],
                placements: {
                    description: "The CS&BS program is industry-oriented with special placement support from collaborating partners. Students are exposed to internships and industry-driven projects; TCS has a preference for this program.",
                    topRecruiters: ["TCS"]
                },
                achievements: [
                    "Active forum and student-led initiatives (IGNITE, technical forums)",
                    "Organised workshops and FDPs on Business Intelligence, AI and UI/UX"
                ]
            }
        }
} as unknown) as CollegeInfo;
