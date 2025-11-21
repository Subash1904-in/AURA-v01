
import { CollegeInfo } from '../types';

// Department Images (SVG placeholders)
const aidsImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2U4ZjVlOSIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzFiNWUyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkFJJmFtcDtEUyBEZXB0Ljwvdext0Pjwvc3ZnPg==';
const asImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PGlyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmY5YzQiIC8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwcHgiIGZpbGw9IiM4MjcxMTciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5BcHBsaWVkIFNjaWVuY2VzPC90ZXh0Pjwvc3ZnPg==';
const civilImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZTRlMSIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzVkNDAzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkNpdmlsIEVuZy48L3RleHQ+PC9zdmc+';
const cseImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RiZTlmZiIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzE3Mjc1NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkNTRSBEZXB0Ljwvdext0Pjwvc3ZnPg==';
const eceImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZTdmYiIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzc4MmMwMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkVDRSBEZXB0Ljwvdext0Pjwvc3ZnPg==';
const mechImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjUwIDE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjRmYyIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjBweCIgZmlsbD0iIzQ0NDAzYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPk1lY2ggRGVwdC48L3RleHQ+PC9zdmc+';

export const collegeDatabase: CollegeInfo = {
    about: {
        mission: "To provide a conducive environment for continuous learning, research, and development in the field of technical education, fostering innovation, ethical values, and social responsibility.",
        vision: "To be a premier institution in technical education, producing competent professionals with strong foundations in engineering, management, and ethical values who contribute meaningfully to society and industry.",
        description: "K. S. School of Engineering and Management (KSSEM) was established in 2010 by the Kammavari Sangham (Registered 1952), part of the K. S. Group of Institutions. Located at No.15, Mallasandra, Off Kanakapura Road, Bengaluru-560109, KSSEM is approved by AICTE, New Delhi and affiliated to Visvesvaraya Technological University (VTU), Belagavi. The institution is accredited by NAAC and offers quality technical education with state-of-the-art infrastructure, experienced faculty, and strong industry connections.",
        keywords: ["about kssem", "history", "mission", "vision", "kammavari sangham", "about college", "ks group", "vtu", "aicte", "naac", "bengaluru", "kanakapura road"],
    },
    admissions: {
        process: "Admissions to KSSEM are based on ranks obtained in the Karnataka Common Entrance Test (KCET) and COMEDK UGET examinations. Management quota seats are also available for eligible candidates. The admission process is conducted in accordance with the guidelines set by the Government of Karnataka and the consortium. For the Academic Year 2026-2027, admissions are open. Contact: 9900710055 for more information.",
        eligibility: "For undergraduate B.E. programs, candidates must have passed 10+2 or equivalent examination (PUC/Diploma) with Physics and Mathematics as compulsory subjects, along with Chemistry/Computer Science/Electronics/Biology as optional subjects. Minimum aggregate marks requirements apply as per VTU and government norms.",
        keywords: ["admissions", "how to apply", "eligibility", "kcet", "comedk", "management quota", "entrance test", "apply", "join", "enroll", "admission process"],
    },
    placements: {
        description: "The Placement and Training Department at KSSEM provides comprehensive training and career guidance to students to prepare them for successful corporate careers. With a dedicated placement cell, strong industry partnerships, and regular campus recruitment drives, KSSEM ensures students are well-prepared for the job market. The department organizes pre-placement training, aptitude tests, mock interviews, and soft skills development programs. In the last academic year, KSSEM achieved remarkable placement results with over 90% of eligible students placed. The highest package offered was 27 LPA by a leading tech giant, and the average package stood at 5.5 LPA. Students secured roles in software development, data science, core engineering, and management profiles.",
        recruiters: ["Infosys", "Wipro", "TCS", "Capgemini", "HCL Technologies", "Accenture", "Tech Mahindra", "Cognizant", "Mphasis", "IBM", "Axis Bank", "CISCO", "SAP", "Microsoft Partners", "Amazon", "Mercedes Benz", "Toyota Kirloskar", "Bosch"],
        keywords: ["placements", "jobs", "companies", "recruiters", "training", "campus placement", "career", "employment", "package", "salary", "highest package", "average package", "last year placements"],
    },
    sports: {
        description: "KSSEM encourages students to participate in various sports and games to ensure physical fitness and holistic development. The college provides excellent sports facilities and coaching. Our students regularly participate and win prizes in VTU inter-collegiate, state, and national level tournaments.",
        achievements: [
            "Winners of VTU Inter-Collegiate Cricket Tournament 2024",
            "Runners-up in VTU State Level Throwball Championship (Women)",
            "Gold Medal in VTU Athletics Meet (100m Sprint)",
            "Semi-finalists in State Level Kabaddi Tournament",
            "Mr. KSSEM secured 3rd place in Inter-Collegiate Bodybuilding Competition"
        ],
        facilities: [
            "Large playground for Cricket and Football",
            "Basketball Court",
            "Volleyball Court",
            "Throwball Court",
            "Indoor games facility (Table Tennis, Carrom, Chess)",
            "Well-equipped Gymnasium"
        ],
        keywords: ["sports", "games", "cricket", "football", "basketball", "volleyball", "throwball", "gym", "athletics", "tournament", "championship", "winners", "runners-up", "achievements", "physical education"],
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
            description: "The Department of Computer Science and Engineering (formerly Computer Science & Business Systems) blends the power of technology with the world of business. Established in 2022 with intake of 60 students, this program is designed by TCS and approved by AICTE to provide Industry 4.0 ready professionals. Vision: To provide competent learning ecosystem to develop understanding of technology and business systems. The curriculum covers core computer science subjects such as software development, databases, cybersecurity, and data analytics, while also providing insights into business management. Students are equipped with knowledge to design, develop, and implement technology solutions to support business operations, improve decision-making, and drive innovation. The department has established IGNITE Technical Forum and has industry collaborations with CISCO and HCL Technologies. Technical activities include CODE SPRINT coding competition, workshops on UI/UX Design, MERN Stack, Business Intelligence & Data Analytics, and industrial visits to ISRO (U.R. Rao Satellite Centre) and UAS GKVK.",
            identifiers: ["cse", "computer science", "cs", "csbs"],
            faculty: [
                { name: "Prof. Ramesh Babu N", designation: "Associate Professor and Head" },
                { name: "Mrs. Jayashree L K", designation: "Associate Professor" },
                { name: "Mrs. Nayana H P", designation: "Assistant Professor" },
                { name: "Mrs. Frinkly Sathanga Shanija T", designation: "Assistant Professor" },
                { name: "Ms. Kiranashree B K", designation: "Assistant Professor" },
                { name: "Mrs. Seema Bawgi", designation: "Assistant Professor" },
                { name: "Mrs. Shubhangi", designation: "Assistant Professor" },
                { name: "Ms. Harini Karan", designation: "Assistant Professor" },
                { name: "Mrs. Divyashree N", designation: "Assistant Professor" },
                { name: "Mr. Sreeranga P", designation: "Assistant Professor" },
                { name: "Ms. Tejaswini S J", designation: "Programmer" },
                { name: "Ms. V Manasa", designation: "Lab Assistant" },
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
            keywords: ["computer science", "cse", "cs", "coding", "programming", "software", "it", "information technology", "csbs", "business systems", "computers"],
            placements: {
                description: "The CSE department consistently achieves the highest placement numbers in the college. With a focus on coding proficiency and system design, students secure roles in product-based and service-based companies.",
                highestPackage: "24 LPA",
                averagePackage: "7.5 LPA",
                placementRate: "98%",
                topRecruiters: ["Google", "Adobe", "Oracle", "Cisco", "TCS", "Infosys", "Wipro", "Mindtree"]
            },
            achievements: [
                "Winners of the 'Smart India Hackathon' 2023.",
                "Developed a college management mobile application used by 2000+ students.",
                "Students selected for Google Summer of Code (GSoC).",
                "Hosted 'CodeSprint', a state-level coding marathon.",
                "Published patents on IoT-based healthcare monitoring systems."
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
        }
    }
};
