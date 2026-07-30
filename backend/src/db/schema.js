const { pgTable, serial, text, varchar, integer, boolean, date, timestamp, decimal, pgEnum, foreignKey, index } = require('drizzle-orm/pg-core');

// Enums - must be defined before tables
const roleEnum = pgEnum('role', ['committee', 'member']);
const familyStatusEnum = pgEnum('family_status', ['pending', 'approved']);
const genderEnum = pgEnum('gender', ['male', 'female']);
const maritalStatusEnum = pgEnum('marital_status', ['married', 'unmarried']);
const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent']);
const collectionTypeEnum = pgEnum('collection_type', ['zakat', 'sadaqah', 'eid', 'madrasa_fund', 'other']);
const expenseCategoryEnum = pgEnum('expense_category', ['electricity', 'imam_salary', 'maintenance', 'construction', 'other']);
const feeStatusEnum = pgEnum('fee_status', ['paid', 'partial', 'unpaid']);
const galleryCategoryEnum = pgEnum('gallery_category', ['Construction', 'Events', 'Facilities', 'Home Banner']);

// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 15 }).unique().notNull(),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('member'),
  familyId: integer('family_id').references(() => families.id, { onDelete: 'set null' }),
  committeeMemberId: integer('committee_member_id').references(() => committeeMembers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index('users_phone_idx').on(table.phone),
  familyIdIdx: index('users_family_id_idx').on(table.familyId),
}));

// Places table
const places = pgTable('places', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
});

// Families table
const families = pgTable('families', {
  id: serial('id').primaryKey(),
  headName: varchar('head_name', { length: 100 }).notNull(),
  headPhone: varchar('head_phone', { length: 15 }).notNull(),
  placeId: integer('place_id').references(() => places.id, { onDelete: 'restrict' }).notNull(),
  address: text('address'),
  photoUrl: varchar('photo_url', { length: 500 }),
  monthlyFeeMarried: integer('monthly_fee_married').notNull().default(300),
  monthlyFeeUnmarried: integer('monthly_fee_unmarried').notNull().default(200),
  status: familyStatusEnum('status').notNull().default('pending'),
  createdBy: integer('created_by').references(() => committeeMembers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  placeIdIdx: index('families_place_id_idx').on(table.placeId),
  statusIdx: index('families_status_idx').on(table.status),
  headPhoneIdx: index('families_head_phone_idx').on(table.headPhone),
}));

// Family members table
const familyMembers = pgTable('family_members', {
  id: serial('id').primaryKey(),
  familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  relation: varchar('relation', { length: 50 }).notNull(), // Wife, Son, Daughter, Father, Mother, Grandfather, Grandmother, etc.
  phone: varchar('phone', { length: 15 }), // Optional phone for individual members
  age: integer('age'),
  gender: genderEnum('gender'),
  maritalStatus: maritalStatusEnum('marital_status'),
  occupation: varchar('occupation', { length: 100 }), // Optional occupation
  isFeeApplicable: boolean('is_fee_applicable').notNull().default(true),
}, (table) => ({
  familyIdIdx: index('family_members_family_id_idx').on(table.familyId),
}));

// Committee members table
const committeeMembers = pgTable('committee_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  designation: varchar('designation', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  tenureStart: date('tenure_start'),
  tenureEnd: date('tenure_end'),
  pinHash: varchar('pin_hash', { length: 255 }),
}, (table) => ({
  phoneIdx: index('committee_members_phone_idx').on(table.phone),
}));

// Ustads table (Madrasa teachers)
const ustads = pgTable('ustads', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Madrasa students table (new structure)
const madrasaStudents = pgTable('madrasa_students', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  standard: varchar('standard', { length: 20 }).notNull(), // 1st Standard through 10th Standard
  fatherName: varchar('father_name', { length: 100 }).notNull(),
  fatherPhone: varchar('father_phone', { length: 15 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  standardIdx: index('madrasa_students_standard_idx').on(table.standard),
  fatherPhoneIdx: index('madrasa_students_father_phone_idx').on(table.fatherPhone),
}));

// Madrasa attendance table (new structure)
const madrasaAttendance = pgTable('madrasa_attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => madrasaStudents.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  markedByUstadId: integer('marked_by_ustad_id').references(() => ustads.id, { onDelete: 'set null' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  studentIdIdx: index('madrasa_attendance_student_id_idx').on(table.studentId),
  dateIdx: index('madrasa_attendance_date_idx').on(table.date),
  markedByUstadIdIdx: index('madrasa_attendance_marked_by_ustad_id_idx').on(table.markedByUstadId),
}));

// Namaz timings table
const namazTimings = pgTable('namaz_timings', {
  id: serial('id').primaryKey(),
  effectiveFrom: date('effective_from').notNull(),
  fajrAzan: varchar('fajr_azan', { length: 10 }).notNull(),
  fajrIqamah: varchar('fajr_iqamah', { length: 10 }).notNull(),
  zuhrAzan: varchar('zuhr_azan', { length: 10 }).notNull(),
  zuhrIqamah: varchar('zuhr_iqamah', { length: 10 }).notNull(),
  asrAzan: varchar('asr_azan', { length: 10 }).notNull(),
  asrIqamah: varchar('asr_iqamah', { length: 10 }).notNull(),
  maghribAzan: varchar('maghrib_azan', { length: 10 }).notNull(),
  maghribIqamah: varchar('maghrib_iqamah', { length: 10 }).notNull(),
  ishaAzan: varchar('isha_azan', { length: 10 }).notNull(),
  ishaIqamah: varchar('isha_iqamah', { length: 10 }).notNull(),
  jummaKhutbahTime: varchar('jumma_khutbah_time', { length: 10 }).notNull(),
  sehriTime: varchar('sehri_time', { length: 10 }),
  iftarTime: varchar('iftar_time', { length: 10 }),
}, (table) => ({
  effectiveFromIdx: index('namaz_timings_effective_from_idx').on(table.effectiveFrom),
}));

// Announcements table
const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  postedBy: integer('posted_by').references(() => committeeMembers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('announcements_created_at_idx').on(table.createdAt),
}));

// Events table
const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  eventDate: date('event_date').notNull(),
  eventTime: varchar('event_time', { length: 10 }).notNull(),
  location: varchar('location', { length: 200 }),
  createdBy: integer('created_by').references(() => committeeMembers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventDateIdx: index('events_event_date_idx').on(table.eventDate),
}));

// Gallery photos table
const galleryPhotos = pgTable('gallery_photos', {
  id: serial('id').primaryKey(),
  photoUrl: varchar('photo_url', { length: 500 }).notNull(),
  category: galleryCategoryEnum('category').notNull(),
  caption: varchar('caption', { length: 300 }),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  uploadedBy: integer('uploaded_by').references(() => committeeMembers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('gallery_photos_category_idx').on(table.category),
  eventIdIdx: index('gallery_photos_event_id_idx').on(table.eventId),
}));

// Collections table (Zakat, Sadaqah, Eid, etc.)
const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  type: collectionTypeEnum('type').notNull(),
  familyId: integer('family_id').references(() => families.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  date: date('date').notNull(),
  note: text('note'),
  enteredBy: integer('entered_by').references(() => committeeMembers.id, { onDelete: 'set null' }).notNull(),
}, (table) => ({
  typeIdx: index('collections_type_idx').on(table.type),
  familyIdIdx: index('collections_family_id_idx').on(table.familyId),
  dateIdx: index('collections_date_idx').on(table.date),
}));

// Expenses table
const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: expenseCategoryEnum('category').notNull(),
  amount: integer('amount').notNull(),
  date: date('date').notNull(),
  note: text('note'),
  enteredBy: integer('entered_by').references(() => committeeMembers.id, { onDelete: 'set null' }).notNull(),
}, (table) => ({
  categoryIdx: index('expenses_category_idx').on(table.category),
  dateIdx: index('expenses_date_idx').on(table.date),
}));

// Monthly fees table
const monthlyFees = pgTable('monthly_fees', {
  id: serial('id').primaryKey(),
  familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // Format: "2026-07"
  calculatedFee: integer('calculated_fee').notNull(),
  openingBalance: integer('opening_balance').notNull().default(0),
  totalDue: integer('total_due').notNull(),
  amountPaid: integer('amount_paid').notNull().default(0),
  closingBalance: integer('closing_balance').notNull(),
  status: feeStatusEnum('status').notNull().default('unpaid'),
  paidDate: date('paid_date'),
  collectedBy: integer('collected_by').references(() => committeeMembers.id, { onDelete: 'set null' }),
  note: text('note'),
}, (table) => ({
  familyIdIdx: index('monthly_fees_family_id_idx').on(table.familyId),
  monthIdx: index('monthly_fees_month_idx').on(table.month),
  statusIdx: index('monthly_fees_status_idx').on(table.status),
}));

// Dues entries table (balance ledger)
const duesEntries = pgTable('dues_entries', {
  id: serial('id').primaryKey(),
  personName: varchar('person_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }),
  type: varchar('type', { length: 20 }).notNull().default('payment'), // 'balance_edit' or 'payment'
  amount: integer('amount').notNull().default(0), // For balance_edit: new balance value; for payment: payment amount
  oldBalance: integer('old_balance').notNull().default(0), // Previous balance before this action
  newBalance: integer('new_balance').notNull().default(0), // For balance_edit: same as amount; for payment: oldBalance - amount
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  approvedBy: integer('approved_by').references(() => committeeMembers.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  // Legacy field for backward compatibility during migration
  paymentAmount: integer('payment_amount').notNull().default(0),
}, (table) => ({
  statusIdx: index('dues_entries_status_idx').on(table.status),
  typeIdx: index('dues_entries_type_idx').on(table.type),
  createdAtIdx: index('dues_entries_created_at_idx').on(table.createdAt),
}));

module.exports = {
  users,
  places,
  families,
  familyMembers,
  committeeMembers,
  ustads,
  madrasaStudents,
  madrasaAttendance,
  namazTimings,
  announcements,
  events,
  galleryPhotos,
  collections,
  expenses,
  monthlyFees,
  duesEntries,
};
