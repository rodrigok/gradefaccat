import {Calendar, Grade} from '../../lib/collections';
import './Calendar.html';


import React, { Component } from 'react';
import {Router} from 'meteor/iron:router';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import {
	Card,
	Icon,
	Tooltip
} from 'antd';


import { render } from 'react-dom';

class CalendarItemComponent extends Component {
	static propTypes = {
		gradeItem: PropTypes.any,
		calendarItem: PropTypes.any,
		user: PropTypes.object,
		calendar: PropTypes.object
	}

	state = {}

	removeInterest() {
		const {gradeItem, calendarItem, calendar} = this.props;
		return Meteor.call('updateCalendarItemInterest', calendar._id, gradeItem._id, calendarItem.shift, calendarItem.day, false);
	}

	addInterest() {
		const {gradeItem, calendarItem, calendar} = this.props;
		return Meteor.call('updateCalendarItemInterest', calendar._id, gradeItem._id, calendarItem.shift, calendarItem.day, true);
	}

	render() {
		const {user, gradeItem, calendarItem, calendar} = this.props;

		const itemStatus = (user && user.grade && user.grade[gradeItem._id]) || 'pending';

		const actions = [];
		let description;

		if (user && itemStatus === 'pending') {
			const key = `${ calendarItem.shift }${ calendarItem.day }-${ gradeItem._id }`;
			const interested = user && user.calendar && user.calendar[calendar._id] && user.calendar[calendar._id].indexOf(key) > -1;

			if (interested) {
				actions.push(
					<Tooltip placement='bottom' title='Remover interesse'>
						<Icon type='heart' onClick={this.removeInterest.bind(this)} />
					</Tooltip>
				);
			} else {
				actions.push(
					<Tooltip placement='bottom' title='Marcar interesse'>
						<Icon type='heart-o' onClick={this.addInterest.bind(this)} />
					</Tooltip>
				);
			}
			// actions.push(<Icon type='ellipsis' />);
		}

		description = `Interessados: ${ calendarItem.interested }`;

		if (calendarItem.teacher) {
			description = <React.Fragment>
				<div>{description}</div>
				<div>Professor: {calendarItem.teacher}</div>
			</React.Fragment>;
		}

		return (
			<Card
				className={`card-${ itemStatus }`}
				actions={actions}
			>
				<Card.Meta
					title={gradeItem.name.SI}
					description={description}
				/>
			</Card>
		);
	}
}

class CalendarComponent extends Component {
	static propTypes = {
		shifts: PropTypes.any,
		data: PropTypes.any,
		user: PropTypes.object,
		hasEAD: PropTypes.bool
	}

	state = {}

	constructor() {
		super();
	}

	renderCalendarItem(shift, day) {
		const data = this.props.data.grade.filter(d => d.shift === shift && d.day === day);
		return data.map(d => {
			const item = Grade.findOne({_id: d._id});
			if (item.code.SI) {
				return <CalendarItemComponent key={d._id} gradeItem={item} calendarItem={d} calendar={this.props.data} user={this.props.user} />;
			}
		}).filter(i => i);
	}

	renderShifts() {
		return this.props.shifts.map(shit => (
			<React.Fragment key={shit.shift}>
				<tr className='shift-table-title-line'>
					<td colSpan='7'>
						<strong>Turno: {shit.name}</strong>
					</td>
				</tr>
				<tr className='shift-table-line'>
					<td>{this.renderCalendarItem.bind(this)(shit.shift, '2')}</td>
					<td>{this.renderCalendarItem.bind(this)(shit.shift, '3')}</td>
					<td>{this.renderCalendarItem.bind(this)(shit.shift, '4')}</td>
					<td>{this.renderCalendarItem.bind(this)(shit.shift, '5')}</td>
					<td>{this.renderCalendarItem.bind(this)(shit.shift, '6')}</td>
					<td>{this.renderCalendarItem.bind(this)(shit.shift, '7')}</td>
				</tr>
			</React.Fragment>
		));
	}

	renderEAD() {
		if (!this.props.hasEAD) {
			return;
		}

		return (
			<div className='ant-table ant-table-large ant-table-bordered ant-table-scroll-position-left'>
				<div className='ant-table-body'>
					<table>
						<thead className='ant-table-thead'>
							<tr>
								<th>EAD</th>
							</tr>
						</thead>
						<tbody className='ant-table-tbody'>
							<tr className='shift-table-line'>
								<td>
									{this.renderCalendarItem('0', '0')}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	render() {
		return (
			<React.Fragment>
				{this.renderEAD()}

				<div className='ant-table ant-table-large ant-table-bordered ant-table-scroll-position-left'>
					<div className='ant-table-body'>
						<table>
							<thead className='ant-table-thead'>
								<tr>
									<th width='16.66%'>Segunda</th>
									<th width='16.66%'>Terça</th>
									<th width='16.66%'>Quarta</th>
									<th width='16.66%'>Quinta</th>
									<th width='16.66%'>Sexta</th>
									<th width='16.66%'>Sábado</th>
								</tr>
							</thead>
							<tbody className='ant-table-tbody'>
								{this.renderShifts()}
							</tbody>
						</table>
					</div>
				</div>
			</React.Fragment>
		);
	}
}

const CalendarComponentWithTracking = withTracker(() => {
	const data = Calendar.findOne({_id: Router.current().params.calendarName});
	const shifts = [{
		shift: '1',
		name: 'Manhã'
	}, {
		shift: '2',
		name: 'Tarde'
	}, {
		shift: '3',
		name: 'Noite'
	}, {
		shift: '5',
		name: 'Vespertino'
	}];

	if (!data) {
		return {
			user: Meteor.user(),
			shifts: [],
			hasEAD: false,
			data: []
		};
	}

	return {
		user: Meteor.user(),
		shifts: shifts.filter(s => data.grade.filter(d => d.shift === s.shift).length),
		hasEAD: data.grade.filter(d => d.shift === '0').length > 0,
		data
	};
})(CalendarComponent);

Template.Calendar.onRendered(() => {
	render(<CalendarComponentWithTracking />, document.getElementById('render-calendar'));
});
