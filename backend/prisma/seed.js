const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Cleaning existing data...');
    await prisma.examAttempt.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.assignmentSubmission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.discussionReply.deleteMany();
    await prisma.discussion.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.teacherAttendance.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.fee.deleteMany();
    await prisma.timetableSlot.deleteMany();
    await prisma.timetable.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.subjectTeacher.deleteMany();
    await prisma.libraryBorrow.deleteMany();
    await prisma.libraryBook.deleteMany();
    await prisma.transportAssignment.deleteMany();
    await prisma.transportRoute.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.sgbMember.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();
    await prisma.institution.deleteMany();
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Admin@123', salt);

  // ============================================
  // CREATE INSTITUTION
  // ============================================
  
  console.log('🏫 Creating institution...');
  const institution = await prisma.institution.create({
    data: {
      name: 'Johannesburg High School',
      type: 'Public School',
      emisNumber: 'EMIS123456',
      province: 'Gauteng',
      district: 'Johannesburg Metro',
      address: '123 Education Street, Johannesburg, 2000',
      phone: '+27 11 123 4567',
      email: 'admin@jhb-high.co.za',
      principal: 'Mrs. Jane Smith',
      foundedDate: new Date('1980-01-15')
    }
  });

  // ============================================
  // CREATE SUPER ADMIN
  // ============================================
  
  console.log('👨‍💼 Creating super admin...');
  await prisma.user.create({
    data: {
      email: 'admin@edumanage.co.za',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      institutionId: institution.id,
      isActive: true
    }
  });

  // ============================================
  // CREATE PRINCIPAL
  // ============================================
  
  console.log('👩‍🏫 Creating principal...');
  const principalUser = await prisma.user.create({
    data: {
      email: 'principal@jhb-high.co.za',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'PRINCIPAL',
      institutionId: institution.id,
      phone: '+27 11 123 4567',
      isActive: true
    }
  });

  // ============================================
  // CREATE SUBJECTS
  // ============================================
  
  console.log('📚 Creating subjects...');
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH',
        description: 'Mathematics curriculum as per CAPS',
        grade: 'Grade 10-12',
        institutionId: institution.id,
        isCore: true
      }
    }),
    prisma.subject.create({
      data: {
        name: 'Life Sciences',
        code: 'LIFESCI',
        description: 'Life Sciences curriculum',
        grade: 'Grade 10-12',
        institutionId: institution.id,
        isCore: true
      }
    }),
    prisma.subject.create({
      data: {
        name: 'Physical Sciences',
        code: 'PHYSCI',
        description: 'Physical Sciences curriculum',
        grade: 'Grade 10-12',
        institutionId: institution.id,
        isCore: true
      }
    }),
    prisma.subject.create({
      data: {
        name: 'English Home Language',
        code: 'ENG',
        description: 'English Home Language',
        grade: 'Grade 10-12',
        institutionId: institution.id,
        isCore: true
      }
    }),
    prisma.subject.create({
      data: {
        name: 'History',
        code: 'HIST',
        description: 'History curriculum',
        grade: 'Grade 10-12',
        institutionId: institution.id,
        isCore: false
      }
    })
  ]);

  // ============================================
  // CREATE TEACHERS
  // ============================================
  
  console.log('👨‍🏫 Creating teachers...');
  const teacherUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@jhb-high.co.za',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
        institutionId: institution.id,
        phone: '+27 11 111 1111',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'mary.johnson@jhb-high.co.za',
        password: hashedPassword,
        firstName: 'Mary',
        lastName: 'Johnson',
        role: 'TEACHER',
        institutionId: institution.id,
        phone: '+27 11 222 2222',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'david.williams@jhb-high.co.za',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Williams',
        role: 'TEACHER',
        institutionId: institution.id,
        phone: '+27 11 333 3333',
        isActive: true
      }
    })
  ]);

  const teachers = await Promise.all(
    teacherUsers.map((user, index) => 
      prisma.teacher.create({
        data: {
          userId: user.id,
          institutionId: institution.id,
          employeeNumber: `EMP2024${String(index + 1).padStart(3, '0')}`,
          saceNumber: `SACE${100000 + index}`,
          qualifications: 'Bachelor of Education',
          specialization: subjects[index].name,
          yearsExperience: 10 + index,
          hireDate: new Date('2015-01-15'),
          contractType: 'Permanent',
          employmentStatus: 'Active',
          status: 'ACTIVE'
        }
      })
    )
  );

  // Link teachers to subjects
  await Promise.all(
    teachers.map((teacher, index) => 
      prisma.subjectTeacher.create({
        data: {
          teacherId: teacher.id,
          subjectId: subjects[index].id,
          academicYear: 2024
        }
      })
    )
  );

  // ============================================
  // CREATE CLASSES
  // ============================================
  
  console.log('🎓 Creating classes...');
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: 'Grade 10A',
        grade: 'Grade 10',
        section: 'A',
        academicYear: 2024,
        institutionId: institution.id,
        classTeacherId: teachers[0].id,
        capacity: 40,
        room: 'Room 101'
      }
    }),
    prisma.class.create({
      data: {
        name: 'Grade 11A',
        grade: 'Grade 11',
        section: 'A',
        academicYear: 2024,
        institutionId: institution.id,
        classTeacherId: teachers[1].id,
        capacity: 40,
        room: 'Room 201'
      }
    }),
    prisma.class.create({
      data: {
        name: 'Grade 12A',
        grade: 'Grade 12',
        section: 'A',
        academicYear: 2024,
        institutionId: institution.id,
        classTeacherId: teachers[2].id,
        capacity: 40,
        room: 'Room 301'
      }
    })
  ]);

  // ============================================
  // CREATE STUDENTS & PARENTS
  // ============================================
  
  console.log('🎓 Creating students and parents...');
  
  const studentCount = 15;
  for (let i = 0; i < studentCount; i++) {
    const classIndex = i % 3;
    const selectedClass = classes[classIndex];
    
    // Create parent user
    const parentUser = await prisma.user.create({
      data: {
        email: `parent${i + 1}@example.com`,
        password: hashedPassword,
        firstName: `Parent${i + 1}`,
        lastName: `Family`,
        role: 'PARENT',
        institutionId: institution.id,
        phone: `+27 82 ${String(i + 1).padStart(7, '0')}`,
        isActive: true
      }
    });

    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        occupation: 'Professional',
        employer: 'ABC Company'
      }
    });

    // Create student user
    const studentUser = await prisma.user.create({
      data: {
        email: `student${i + 1}@jhb-high.co.za`,
        password: hashedPassword,
        firstName: `Student${i + 1}`,
        lastName: `Learner`,
        role: 'STUDENT',
        institutionId: institution.id,
        idNumber: `00${String(i + 1).padStart(11, '0')}`,
        isActive: true
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        institutionId: institution.id,
        admissionNumber: `STU2024${String(i + 1).padStart(4, '0')}`,
        admissionDate: new Date('2024-01-15'),
        dateOfBirth: new Date('2008-05-15'),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        nationality: 'South African',
        homeLanguage: 'English',
        currentGrade: selectedClass.grade,
        classId: selectedClass.id,
        guardianName: `Parent${i + 1} Family`,
        guardianPhone: `+27 82 ${String(i + 1).padStart(7, '0')}`,
        guardianEmail: `parent${i + 1}@example.com`,
        guardianRelation: 'Parent',
        emergencyContact: `Parent${i + 1} Family`,
        emergencyPhone: `+27 82 ${String(i + 1).padStart(7, '0')}`,
        feeCategory: 'Standard',
        feeExemption: i % 5 === 0,
        outstandingBalance: 0,
        status: 'ACTIVE',
        parents: {
          connect: { id: parent.id }
        }
      }
    });

    // Enroll student in subjects
    for (const subject of subjects.slice(0, 4)) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: selectedClass.id,
          subjectId: subject.id,
          academicYear: 2024,
          term: 1,
          status: 'Active'
        }
      });
    }
  }

  // ============================================
  // CREATE FEES
  // ============================================
  
  console.log('💰 Creating fees...');
  await prisma.fee.create({
    data: {
      institutionId: institution.id,
      name: 'School Fees - Term 1',
      description: 'Tuition fees for Term 1, 2024',
      amount: 2500,
      feeType: 'TUITION',
      academicYear: 2024,
      term: 1,
      dueDate: new Date('2024-02-28'),
      isCompulsory: true
    }
  });

  // ============================================
  // CREATE LIBRARY BOOKS
  // ============================================
  
  console.log('📖 Creating library books...');
  await Promise.all([
    prisma.libraryBook.create({
      data: {
        institutionId: institution.id,
        isbn: '978-0-12-345678-9',
        title: 'Advanced Mathematics Grade 12',
        author: 'J. Smith',
        publisher: 'SA Publishers',
        publicationYear: 2023,
        category: 'Textbook',
        subject: 'Mathematics',
        totalCopies: 50,
        availableCopies: 50,
        location: 'Shelf A1'
      }
    }),
    prisma.libraryBook.create({
      data: {
        institutionId: institution.id,
        isbn: '978-0-98-765432-1',
        title: 'Life Sciences Essentials',
        author: 'M. Johnson',
        publisher: 'Educational Press',
        publicationYear: 2023,
        category: 'Textbook',
        subject: 'Life Sciences',
        totalCopies: 45,
        availableCopies: 45,
        location: 'Shelf B1'
      }
    })
  ]);

  // ============================================
  // CREATE SGB MEMBERS
  // ============================================
  
  console.log('🏛️ Creating SGB members...');
  await Promise.all([
    prisma.sGBMember.create({
      data: {
        institutionId: institution.id,
        name: 'Robert Anderson',
        role: 'Chairperson',
        memberType: 'Parent',
        email: 'robert.anderson@example.com',
        phone: '+27 82 999 9999',
        appointedDate: new Date('2023-01-15'),
        termEndDate: new Date('2026-01-15'),
        status: 'Active'
      }
    }),
    prisma.sGBMember.create({
      data: {
        institutionId: institution.id,
        name: 'Sarah Williams',
        role: 'Treasurer',
        memberType: 'Parent',
        email: 'sarah.williams@example.com',
        phone: '+27 82 888 8888',
        appointedDate: new Date('2023-01-15'),
        termEndDate: new Date('2026-01-15'),
        status: 'Active'
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📝 Default Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: admin@edumanage.co.za');
  console.log('  Password: Admin@123');
  console.log('\nPrincipal:');
  console.log('  Email: principal@jhb-high.co.za');
  console.log('  Password: Admin@123');
  console.log('\nTeacher:');
  console.log('  Email: john.doe@jhb-high.co.za');
  console.log('  Password: Admin@123');
  console.log('\nStudent:');
  console.log('  Email: student1@jhb-high.co.za');
  console.log('  Password: Admin@123');
  console.log('\nParent:');
  console.log('  Email: parent1@example.com');
  console.log('  Password: Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
