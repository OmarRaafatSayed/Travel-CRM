import { supabase } from '@/integrations/supabase/client';

interface SeedData {
  leads: any[];
  deals: any[];
  projects: any[];
  accounts: any[];
  invoices: any[];
  contentPlans: any[];
  teams: any[];
  tasks: any[];
}

class SeedService {
  private generateSeedData(orgName: string, orgLanguage: string, orgDescription: string): SeedData {
    const isArabic = orgLanguage === 'ar';
    
    // Sample data based on organization context
    const leads = this.generateLeads(orgName, isArabic);
    const accounts = this.generateAccounts(orgName, isArabic);
    const deals = this.generateDeals(accounts, isArabic);
    const projects = this.generateProjects(accounts, isArabic);
    const invoices = this.generateInvoices(accounts, isArabic);
    const contentPlans = this.generateContentPlans(accounts, isArabic);
    const teams = this.generateTeams(isArabic);
    const tasks = this.generateTasks(teams, isArabic);

    return {
      leads,
      deals,
      projects,
      accounts,
      invoices,
      contentPlans,
      teams,
      tasks
    };
  }

  private generateLeads(orgName: string, isArabic: boolean) {
    const arabicNames = [
      { first: 'أحمد', last: 'محمد', company: 'شركة التقنية المتقدمة', email: 'ahmed.mohamed@tech-advanced.com' },
      { first: 'فاطمة', last: 'علي', company: 'مؤسسة الإبداع', email: 'fatma.ali@creativity.com' },
      { first: 'محمد', last: 'حسن', company: 'شركة النجاح', email: 'mohamed.hassan@success.com' },
      { first: 'نور', last: 'أحمد', company: 'مجموعة الرؤية', email: 'nour.ahmed@vision-group.com' },
      { first: 'عمر', last: 'سالم', company: 'شركة الابتكار', email: 'omar.salem@innovation.com' }
    ];

    const englishNames = [
      { first: 'John', last: 'Smith', company: 'Tech Solutions Inc', email: 'john.smith@techsolutions.com' },
      { first: 'Sarah', last: 'Johnson', company: 'Creative Agency', email: 'sarah.johnson@creative.com' },
      { first: 'Michael', last: 'Brown', company: 'Business Corp', email: 'michael.brown@business.com' },
      { first: 'Emma', last: 'Davis', company: 'Innovation Hub', email: 'emma.davis@innovation.com' },
      { first: 'David', last: 'Wilson', company: 'Growth Partners', email: 'david.wilson@growth.com' }
    ];

    const names = isArabic ? arabicNames : englishNames;
    const sources = ['website', 'referral', 'socialMedia', 'coldCall', 'event'];
    const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];

    return names.map((name, index) => ({
      first_name: name.first,
      last_name: name.last,
      email: name.email,
      phone: isArabic ? `+20 10 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}` : `+1 555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      company: name.company,
      job_title: isArabic ? ['مدير التسويق', 'مدير المبيعات', 'الرئيس التنفيذي', 'مدير العمليات', 'مدير التطوير'][index] : ['Marketing Manager', 'Sales Director', 'CEO', 'Operations Manager', 'Development Lead'][index],
      source: sources[index % sources.length],
      status: statuses[index % statuses.length],
      notes: isArabic ? `عميل محتمل من ${name.company} - مهتم بخدمات ${orgName}` : `Potential client from ${name.company} - interested in ${orgName} services`,
      score: Math.floor(Math.random() * 100) + 1
    }));
  }

  private generateAccounts(orgName: string, isArabic: boolean) {
    const arabicCompanies = [
      { name: 'شركة التقنية المتقدمة', industry: 'technology', website: 'https://tech-advanced.com' },
      { name: 'مؤسسة الإبداع للتسويق', industry: 'marketing', website: 'https://creativity-marketing.com' },
      { name: 'شركة النجاح التجارية', industry: 'retail', website: 'https://success-commercial.com' },
      { name: 'مجموعة الرؤية للاستثمار', industry: 'finance', website: 'https://vision-investment.com' }
    ];

    const englishCompanies = [
      { name: 'Advanced Tech Solutions', industry: 'technology', website: 'https://advancedtech.com' },
      { name: 'Creative Marketing Agency', industry: 'marketing', website: 'https://creativeagency.com' },
      { name: 'Success Retail Group', industry: 'retail', website: 'https://successretail.com' },
      { name: 'Vision Investment Partners', industry: 'finance', website: 'https://visionpartners.com' }
    ];

    const companies = isArabic ? arabicCompanies : englishCompanies;

    return companies.map((company, index) => ({
      name: company.name,
      industry: company.industry,
      website: company.website,
      phone: isArabic ? `+20 2 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}` : `+1 555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      email: `info@${company.website.split('//')[1]}`,
      address: isArabic ? `${index + 1} شارع النيل، القاهرة، مصر` : `${index + 1} Main Street, New York, NY 10001`,
      city: isArabic ? 'القاهرة' : 'New York',
      country: isArabic ? 'مصر' : 'USA',
      description: isArabic ? `عميل مهم في مجال ${company.industry} - شراكة استراتيجية مع ${orgName}` : `Important client in ${company.industry} sector - strategic partnership with ${orgName}`
    }));
  }

  private generateDeals(accounts: any[], isArabic: boolean) {
    const stages = ['lead', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const currencies = ['USD', 'EGP'];

    return accounts.map((account, index) => ({
      name: isArabic ? `صفقة ${account.name} - خدمات ${index + 1}` : `${account.name} Deal - Services ${index + 1}`,
      value: Math.floor(Math.random() * 50000) + 5000,
      currency: currencies[index % currencies.length],
      stage: stages[index % stages.length],
      probability: Math.floor(Math.random() * 100) + 1,
      expected_close_date: new Date(Date.now() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
      description: isArabic ? `صفقة مهمة مع ${account.name} لتقديم خدمات شاملة` : `Important deal with ${account.name} for comprehensive services`,
      notes: isArabic ? 'متابعة دورية مطلوبة' : 'Regular follow-up required'
    }));
  }

  private generateProjects(accounts: any[], isArabic: boolean) {
    const statuses = ['planning', 'in_progress', 'completed', 'on_hold'];
    const priorities = ['low', 'medium', 'high'];

    return accounts.map((account, index) => ({
      name: isArabic ? `مشروع ${account.name} - التطوير` : `${account.name} Project - Development`,
      description: isArabic ? `مشروع تطوير شامل لـ ${account.name}` : `Comprehensive development project for ${account.name}`,
      status: statuses[index % statuses.length],
      priority: priorities[index % priorities.length],
      budget: Math.floor(Math.random() * 100000) + 10000,
      spent: Math.floor(Math.random() * 50000),
      progress: Math.floor(Math.random() * 100),
      start_date: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  private generateInvoices(accounts: any[], isArabic: boolean) {
    const statuses = ['draft', 'sent', 'paid', 'overdue'];

    return accounts.map((account, index) => ({
      invoice_number: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
      account_name: account.name,
      issue_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      due_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      status: statuses[index % statuses.length],
      subtotal: Math.floor(Math.random() * 20000) + 1000,
      tax_amount: Math.floor(Math.random() * 2000) + 100,
      total_amount: 0, // Will be calculated
      currency: 'USD',
      notes: isArabic ? `فاتورة خدمات ${account.name}` : `Service invoice for ${account.name}`
    }));
  }

  private generateContentPlans(accounts: any[], isArabic: boolean) {
    const types = ['social_media', 'blog_post', 'video', 'email'];
    const statuses = ['draft', 'review', 'approved', 'scheduled', 'published'];

    return accounts.flatMap((account, accountIndex) => 
      types.map((type, typeIndex) => ({
        title: isArabic ? `محتوى ${account.name} - ${type}` : `${account.name} Content - ${type}`,
        content_type: type,
        status: statuses[(accountIndex + typeIndex) % statuses.length],
        scheduled_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        content: isArabic ? `محتوى تسويقي مخصص لـ ${account.name}` : `Marketing content tailored for ${account.name}`,
        notes: isArabic ? 'يحتاج مراجعة قبل النشر' : 'Needs review before publishing'
      }))
    );
  }

  private generateTeams(isArabic: boolean) {
    const teams = isArabic ? [
      { name: 'فريق المبيعات', description: 'فريق مختص في إدارة المبيعات والعملاء' },
      { name: 'فريق التسويق', description: 'فريق مختص في التسويق الرقمي والحملات' },
      { name: 'فريق التطوير', description: 'فريق مختص في تطوير المنتجات والحلول' }
    ] : [
      { name: 'Sales Team', description: 'Dedicated team for sales and client management' },
      { name: 'Marketing Team', description: 'Digital marketing and campaign specialists' },
      { name: 'Development Team', description: 'Product development and solutions team' }
    ];

    return teams;
  }

  private generateTasks(teams: any[], isArabic: boolean) {
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['todo', 'in_progress', 'review', 'done'];

    return teams.flatMap((team, teamIndex) => 
      Array.from({ length: 3 }, (_, taskIndex) => ({
        title: isArabic ? `مهمة ${team.name} ${taskIndex + 1}` : `${team.name} Task ${taskIndex + 1}`,
        description: isArabic ? `مهمة مهمة لفريق ${team.name}` : `Important task for ${team.name}`,
        priority: priorities[taskIndex % priorities.length],
        status: statuses[taskIndex % statuses.length],
        due_date: new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000).toISOString()
      }))
    );
  }

  async seedOrganizationData(organizationId: string, orgName: string, orgLanguage: string, orgDescription: string) {
    try {
      console.log('Starting seed process for organization:', organizationId);
      
      const seedData = this.generateSeedData(orgName, orgLanguage, orgDescription);
      
      // Insert accounts first (they're referenced by other entities)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .insert(seedData.accounts.map(account => ({
          ...account,
          organization_id: organizationId
        })))
        .select();

      if (accountsError) throw accountsError;
      console.log('Accounts seeded:', accounts?.length);

      // Insert leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .insert(seedData.leads.map(lead => ({
          ...lead,
          organization_id: organizationId
        })))
        .select();

      if (leadsError) throw leadsError;
      console.log('Leads seeded:', leads?.length);

      // Insert deals with account references
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .insert(seedData.deals.map((deal, index) => ({
          ...deal,
          organization_id: organizationId,
          account_id: accounts?.[index % accounts.length]?.id || null
        })))
        .select();

      if (dealsError) throw dealsError;
      console.log('Deals seeded:', deals?.length);

      // Insert projects with account references
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .insert(seedData.projects.map((project, index) => ({
          ...project,
          organization_id: organizationId,
          account_id: accounts?.[index % accounts.length]?.id || null
        })))
        .select();

      if (projectsError) throw projectsError;
      console.log('Projects seeded:', projects?.length);

      // Insert invoices
      const invoicesWithTotal = seedData.invoices.map(invoice => ({
        ...invoice,
        total_amount: invoice.subtotal + invoice.tax_amount,
        organization_id: organizationId
      }));

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .insert(invoicesWithTotal)
        .select();

      if (invoicesError) throw invoicesError;
      console.log('Invoices seeded:', invoices?.length);

      // Insert content plans with account references
      const { data: contentPlans, error: contentError } = await supabase
        .from('content_plans')
        .insert(seedData.contentPlans.map((plan, index) => ({
          ...plan,
          organization_id: organizationId,
          account_id: accounts?.[index % accounts.length]?.id || null
        })))
        .select();

      if (contentError) throw contentError;
      console.log('Content plans seeded:', contentPlans?.length);

      // Insert teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .insert(seedData.teams.map(team => ({
          ...team,
          organization_id: organizationId
        })))
        .select();

      if (teamsError) throw teamsError;
      console.log('Teams seeded:', teams?.length);

      // Insert tasks with team references
      if (teams && teams.length > 0) {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .insert(seedData.tasks.map((task, index) => ({
            ...task,
            organization_id: organizationId,
            team_id: teams[Math.floor(index / 3)]?.id || teams[0].id
          })))
          .select();

        if (tasksError) throw tasksError;
        console.log('Tasks seeded:', tasks?.length);
      }

      return {
        success: true,
        message: `Successfully seeded ${seedData.accounts.length} accounts, ${seedData.leads.length} leads, ${seedData.deals.length} deals, ${seedData.projects.length} projects, ${seedData.invoices.length} invoices, ${seedData.contentPlans.length} content plans, ${seedData.teams.length} teams, and ${seedData.tasks.length} tasks.`
      };

    } catch (error) {
      console.error('Seed error:', error);
      return {
        success: false,
        message: `Seed failed: ${error.message}`
      };
    }
  }
}

export const seedService = new SeedService();