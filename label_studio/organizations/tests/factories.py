import factory
from organizations.models import Organization


class OrganizationFactory(factory.django.DjangoModelFactory):
    title = factory.Faker('company')
    created_by = factory.SubFactory('users.tests.factories.UserFactory', active_organization=None)

    class Meta:
        model = Organization

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return Organization.create_organization(**kwargs)

    @factory.post_generation
    def created_by_active_organization(self, create, extracted, **kwargs):
        if not create or not self.created_by:
            return
        self.created_by.active_organization = self
        self.created_by.save(update_fields=['active_organization'])
