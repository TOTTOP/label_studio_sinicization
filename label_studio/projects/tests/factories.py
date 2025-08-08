import factory
from projects.models import Project, ProjectMember


class ProjectFactory(factory.django.DjangoModelFactory):
    title = factory.Faker('bs')
    description = factory.Faker('paragraph')
    organization = factory.SubFactory('organizations.tests.factories.OrganizationFactory')
    created_by = factory.SelfAttribute('organization.created_by')

    class Meta:
        model = Project

    @factory.post_generation
    def created_by_relationship(self, create, extracted, **kwargs):
        if not create or not self.created_by:
            return
        ProjectMember.objects.create(user=self.created_by, project=self)
