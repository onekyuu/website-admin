from django.test import SimpleTestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from api.projects.views import ProjectListApiView


class ProjectListApiViewTests(SimpleTestCase):
    def setUp(self):
        self.request_factory = APIRequestFactory()

    def get_ordering(self, ordering=None):
        query_params = {}
        if ordering is not None:
            query_params['ordering'] = ordering

        view = ProjectListApiView()
        view.request = Request(
            self.request_factory.get('/projects/list/', query_params)
        )

        return view.get_queryset().query.order_by

    def test_orders_projects_by_priority_ascending(self):
        self.assertEqual(
            self.get_ordering('priority'),
            ('priority', '-created_at')
        )

    def test_orders_projects_by_priority_descending(self):
        self.assertEqual(
            self.get_ordering('-priority'),
            ('-priority', '-created_at')
        )

    def test_uses_default_ordering_without_parameter(self):
        self.assertEqual(self.get_ordering(), ('-created_at',))

    def test_uses_default_ordering_for_invalid_parameter(self):
        self.assertEqual(
            self.get_ordering('invalid'),
            ('-created_at',)
        )
