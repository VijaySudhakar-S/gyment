import { PrismaClient } from "../generate/admin/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ;

const adapter = new PrismaPg(
  { connectionString },
  { schema: "admin" }
);
const prisma = new PrismaClient({ adapter });

export const seed = async () => {
  console.log("Seeding Gyment admin database...");
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash("admin@123!@#", salt);

  const superAdmins = [
    {
      email: "vijaysudhakar434@gmail.com",
      name: "Vijay",
      mobile: "8667096760",
      passwordHash,
    }
  ];

  for (const admin of superAdmins) {
    await prisma.superAdmin.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        mobile: admin.mobile,
        passwordHash: admin.passwordHash,
        isActive: true,
      },
      create: {
        email: admin.email,
        name: admin.name,
        mobile: admin.mobile,
        passwordHash: admin.passwordHash,
        isActive: true,
      },
    });
    console.log(`✓ SuperAdmin seeded: ${admin.email}`);
  }

  // Seed dynamic SaaS Subscription Plans
  const plans = [
    {
      name: "Starter",
      description: "Best for single-trainer studios and boutique fitness centers.",
      monthlyPrice: 499,
      yearlyPrice: 4999,
      features: {
        enabledFeatures: {
          "member_management": true,
          "membership_management": true,
          "custom_membership_plans": true,
          "attendance_management": true,
          "payment_records": true,
          "payment_history": true,
          "basic_dashboard": true,
          "basic_reports": true,
          "membership_expiry_alerts": true,
          "csv_export": true
        },
        limits: {
          "Max Members": "100",
          "Max Receptionists": "1",
          "Max Admins": "1",
          "Max Trainers": "1",
          "Multiple Branch Management": "1 branch"
        }
      }
    },
    {
      name: "Growth",
      description: "For growing gyms looking to scale operations and multiple staff members.",
      monthlyPrice: 999,
      yearlyPrice: 9999,
      features: {
        enabledFeatures: {
          "member_management": true,
          "membership_management": true,
          "custom_membership_plans": true,
          "attendance_management": true,
          "multiple_attendance_methods": true,
          "payment_records": true,
          "payment_history": true,
          "basic_dashboard": true,
          "advanced_dashboard_analytics": true,
          "basic_reports": true,
          "advanced_reports": true,
          "revenue_analytics": true,
          "attendance_analytics": true,
          "membership_analytics": true,
          "membership_expiry_alerts": true,
          "trainer_management": true,
          "trainer_member_assignment": true,
          "csv_export": true,
          "excel_export": true,
          "priority_support": true
        },
        limits: {
          "Max Members": "500",
          "Max Receptionists": "3",
          "Max Admins": "2",
          "Max Trainers": "5",
          "Multiple Branch Management": "1 branch"
        }
      }
    },
    {
      name: "Pro",
      description: "Unlimited members and staff for large gyms and multi-floor facilities.",
      monthlyPrice: 1999,
      yearlyPrice: 19999,
      features: {
        enabledFeatures: {
          "member_management": true,
          "membership_management": true,
          "custom_membership_plans": true,
          "attendance_management": true,
          "multiple_attendance_methods": true,
          "payment_records": true,
          "payment_history": true,
          "basic_dashboard": true,
          "advanced_dashboard_analytics": true,
          "basic_reports": true,
          "advanced_reports": true,
          "revenue_analytics": true,
          "attendance_analytics": true,
          "membership_analytics": true,
          "membership_expiry_alerts": true,
          "trainer_management": true,
          "trainer_member_assignment": true,
          "multiple_branch_management": true,
          "branch_wise_reports": true,
          "consolidated_revenue_reports": true,
          "custom_gym_branding": true,
          "automated_notifications": true,
          "whatsapp_sms_integration": true,
          "csv_export": true,
          "excel_export": true,
          "advanced_data_export": true,
          "priority_support": true
        },
        limits: {
          "Max Members": "Unlimited",
          "Max Receptionists": "Unlimited",
          "Max Admins": "Unlimited",
          "Max Trainers": "Unlimited",
          "Multiple Branch Management": "Unlimited"
        }
      }
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        features: plan.features,
        isActive: true,
      },
      create: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        features: plan.features,
        isActive: true,
      },
    });
    console.log(`✓ SaaS Plan seeded: ${plan.name}`);
  }

  // Seed default platform config
  await prisma.platformConfig.upsert({
    where: { key: "platform" },
    update: {
      platformName: "Gyment",
      currency: "INR",
      defaultTimezone: "Asia/Kolkata",
      supportEmail: "vijaysudhakar434@gmail.com",
      supportPhone: "+918667096760",
      maintenanceMode: false,
    },
    create: {
      key: "platform",
      platformName: "Gyment",
      currency: "INR",
      defaultTimezone: "Asia/Kolkata",
      supportEmail: "vijaysudhakar434@gmail.com",
      supportPhone: "+918667096760",
      maintenanceMode: false,
    },
  });
  console.log("✓ Platform config seeded.");


  console.log("\n==================================================");
  console.log("Gyment Database Seeding Completed Successfully!");
  console.log("==================================================");
};

seed()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
